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
    let otherUserToken;

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

        // Register another user for permission checks
        const otherRegisterRes = await request(app)
            .post('/auth/register')
            .send({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                role: 'Customer',
            });

        expect(otherRegisterRes.statusCode).toEqual(201);

        const otherLoginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'other@example.com',
                password: 'password123',
            });

        otherUserToken = otherLoginRes.body.token;

    });


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
        

        const res = await request(app)
            .post('/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: serviceId,
                date: '2024-12-25',
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

        const res = await request(app)
            .post('/appointments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: serviceId,
                date: '2024-12-25',
                time: '14:00',
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toBe('You already have an appointment at this time');
    });

    it('should return 404 if appointment does not exist', async () => {
        const res = await request(app)
            .get('/appointments/666666666666666666666666')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Appointment not found');
    });

    it('should return 400 if the appointment ID is invalid', async () => {
        const res = await request(app)
            .get('/appointments/invalid-id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid appointment ID');
    });

    it('should return the appointment if the user is the owner', async () => {
        const res = await request(app)
            .get(`/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('userId');
        expect(res.body.data.userId.email).toBe(email);
        expect(res.body.data.serviceId).toHaveProperty('name');
    });

    it('should return 403 if the user is not the owner or an admin', async () => {
        const res = await request(app)
            .get(`/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe('Access denied');
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
    });
});
