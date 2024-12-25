const request = require('supertest');
const app = require('../app');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');

describe('Appointment Endpoints', () => {
    let token;
    let email;
    let appointmentId;
    let serviceId;
    let otherEmail;
    let otherUserToken;
    let adminEmail;
    let adminToken
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    beforeAll(async () => {
        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'test1@example.com',
                password: 'password123',
                role: 'Customer',
            });

        expect(registerRes.statusCode).toEqual(201);
        expect(registerRes.body.message).toBe('User registered successfully');

        // Log in the user and get token
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'test1@example.com',
                password: 'password123',
            });

        // Fix token extraction
        token = loginRes.body.token;
        email = 'test1@example.com';
    });

    describe('Create Appointment', () => {
        it('should return 400 if date or time is invalid or in the past', async () => {
            const service = await Service.create({
                name: 'testService',
                price: 25,
            });
            serviceId = service._id;

            const res = await request(app)
                .post('/appointments')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    serviceId: serviceId,
                    date: '2023-12-25',
                    time: '14:00',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid or past date/time');
        });

        it('should return 404 if service does not exist', async () => {
            const res = await request(app)
                .post('/appointments')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    serviceId: "666666666666666666666666",
                    date: '2024-12-25',
                    time: '14:00',
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Service not found');
        });

        it('should return 401 if the user is not authenticated', async () => {


            const res = await request(app)
                .post('/appointments')
                .send({
                    serviceId: serviceId,
                    date: '2024-12-25',
                    time: '14:00',
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Access denied, no token provided');
        });

        it('should create a new appointment successfully', async () => {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const res = await request(app)
                .post('/appointments')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    serviceId: serviceId,
                    date: tomorrow.toISOString().split('T')[0],
                    time: '14:00',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Appointment created successfully');
            expect(res.body.appointment).toHaveProperty('userId');
            expect(res.body.appointment).toHaveProperty('serviceId');
            expect(res.body.appointment).toHaveProperty('date');
            expect(res.body.appointment).toHaveProperty('time');
            expect(res.body.appointment.status).toBe('Pending');

            appointmentId = res.body.appointment._id;
        });

        it('should return 409 if the user already has an appointment at the same time', async () => {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const res = await request(app)
                .post('/appointments')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    serviceId: serviceId,
                    date: tomorrow.toISOString().split('T')[0],
                    time: '14:00',
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body.message).toBe('You already have an appointment at this time');
        });
    });

    describe('Get Appointment', () => {
        it('should return 401 if the user is not authenticated', async () => {
            const res = await request(app)
                .get(`/appointments/${appointmentId}`)

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Access denied, no token provided');
        });

        it('should return 404 if the appointment does not exist', async () => {
            const res = await request(app)
                .get('/appointments/666666666666666666666666')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Appointment not found');
        });

        it('should return 403 if the user is not authorized to view the appointment', async () => {

            await request(app)
                .post('/auth/register')
                .send({
                    name: 'Other User',
                    email: 'other@example.com',
                    password: 'password123',
                    role: 'Customer',
                });

            const otherUserLoginRes = await request(app)
                .post('/auth/login')
                .send({
                    email: 'other@example.com',
                    password: 'password123',
                });

            otherUserToken = otherUserLoginRes.body.token;
            otherEmail = 'other@example.com';
            const res = await request(app)
                .get(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${otherUserToken}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Access denied');
        });

        it('should return the correct appointment details', async () => {
            const res = await request(app)
                .get(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty('userId');
            expect(res.body.data).toHaveProperty('serviceId');
            expect(res.body.data).toHaveProperty('date');
            expect(res.body.data).toHaveProperty('time');
            expect(res.body.data).toHaveProperty('status');
        });
    });

    describe('Update Appointment', () => {

        it('should return 400 if validation fails (invalid date/time)', async () => {
            const res = await request(app)
                .put(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    date: 'invalid-date',
                    time: 'invalid-time',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Validation Error');
        });

        it('should return 404 if the appointment does not exist', async () => {
            const res = await request(app)
                .put('/appointments/666666666666666666666666')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    date: tomorrow.toISOString().split('T')[0],
                    time: '15:00',
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Appointment not found');
        });

        it('should return 403 if user is not authorized to update the appointment', async () => {
            const res = await request(app)
                .put(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({
                    date: tomorrow.toISOString().split('T')[0],
                    time: '15:00',
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Access denied');
        });

        it('should return 200 if the appointment is updated successfully', async () => {
            const res = await request(app)
                .put(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    date: tomorrow.toISOString().split('T')[0],
                    time: '15:00',
                    status: 'Confirmed',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Appointment updated successfully');
            expect(res.body.appointment.date).toBe(new Date(tomorrow).toISOString().split('T')[0] + 'T00:00:00.000Z');
            expect(res.body.appointment.time).toBe('15:00');
            expect(res.body.appointment.status).toBe('Confirmed');
        });

        it('should return 400 if date is in the past', async () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const res = await request(app)
                .put(`/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    date: yesterday.toISOString().split('T')[0],
                    time: '10:00',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toContain('Validation Error: Date must not be in the past');
        });

    });

    describe('Get Appointments', () => {
        it('should return 401 if the user is not authenticated', async () => {
            const res = await request(app).get('/appointments');

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Access denied, no token provided');
        });

        it('should return paginated appointment data successfully', async () => {
            await request(app)
            .post('/auth/register')
            .send({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'Admin',
            });

        const adminLoginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'password123',
            });

        adminToken = adminLoginRes.body.token;
        adminEmail = 'admin@example.com';
       
           
            const res = await request(app)
                .get('/appointments?page=1&limit=2')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Data fetched from database');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should handle invalid pagination parameters gracefully', async () => {
            const res = await request(app)
                .get('/appointments?page=-1&limit=-5')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });

        it('should populate user and service details in the appointments', async () => {

            const res = await request(app)
                .get('/appointments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data[0]).toHaveProperty('userId');
            expect(res.body.data[0]).toHaveProperty('serviceId');
            expect(res.body.data[0]).toHaveProperty('date');
            expect(res.body.data[0]).toHaveProperty('time');
            expect(res.body.data[0]).toHaveProperty('status');
        });
    });


    afterAll(async () => {
        if (appointmentId) {
            await Appointment.findByIdAndDelete(appointmentId);
        }

        if (serviceId) {
            await Service.findByIdAndDelete(serviceId);
        }

        if (email) {
            await User.findOneAndDelete({ email });
        }

        if (otherEmail) {
            await User.findOneAndDelete({ email: otherEmail });
        }
        
        if (adminEmail) {
            await User.findOneAndDelete({ email: adminEmail });
        }
    });
});
