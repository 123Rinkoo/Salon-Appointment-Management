const request = require('supertest');
const app = require('../app');
const Service = require('../models/Service');
const User = require('../models/User');
const redis = require('../config/redis');


describe('Service Endpoints', () => {
    let serviceId;
    let email;
    let token;

    beforeAll(async () => {
        const registerRes = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'test2@example.com',
                password: 'password123',
                role: 'Admin',
            });

        expect(registerRes.statusCode).toEqual(201);
        expect(registerRes.body.message).toBe('User registered successfully');

        // Log in the user and get token
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'test2@example.com',
                password: 'password123',
            });

        // Fix token extraction
        token = loginRes.body.token;
        email = 'test2@example.com';
    });

    describe('Create Service', () => {
        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/services')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Service',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Missing required fields: name, price, or duration');
        });

        it('should create a new service successfully', async () => {
            const res = await request(app)
                .post('/services')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Service',
                    price: 25,
                    duration: 60,
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toBe('Service created successfully');
            expect(res.body.data).toHaveProperty('name', 'Test Service');
            expect(res.body.data).toHaveProperty('price', 25);
            expect(res.body.data).toHaveProperty('duration', 60);

            serviceId = res.body.data._id;  // Store serviceId for later tests
        });
    });

    describe('Get All Services', () => {
        beforeAll(async () => {
            // Clear cache before fetching services
            await redis.flushDb();  // Clears the cache
        });

        it('should fetch services successfully from the database', async () => {
            const res = await request(app)
                .get('/services')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Data fetched from database');
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should return data from the cache', async () => {
            const res = await request(app)
                .get('/services')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 });

            // Check if data was fetched from cache
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Data fetched from cache');
        });
    });

    describe('Update Service', () => {
        it('should return 400 if service ID is invalid', async () => {
            const res = await request(app)
                .put('/services/invalid_id')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Service',
                    price: 30,
                    duration: 90,
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid service ID');
        });

        it('should return 404 if service not found', async () => {
            const res = await request(app)
                .put('/services/666666666666666666666666')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Service',
                    price: 30,
                    duration: 90,
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Service not found');
        });

        it('should update service successfully', async () => {
            const res = await request(app)
                .put(`/services/${serviceId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Service',
                    price: 30,
                    duration: 90,
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Service updated successfully');
            expect(res.body.data.name).toBe('Updated Service');
            expect(res.body.data.price).toBe(30);
            expect(res.body.data.duration).toBe(90);
        });
    });

    describe('Delete Service', () => {
        it('should return 400 if service ID is invalid', async () => {
            const res = await request(app)
                .delete('/services/invalid_id')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Invalid service ID');
        });

        it('should return 404 if service not found', async () => {
            const res = await request(app)
                .delete('/services/666666666666666666666666')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Service not found');
        });

        it('should delete service successfully', async () => {
            const res = await request(app)
                .delete(`/services/${serviceId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Service deleted successfully');
        });
    });

    afterAll(async () => {
        if (serviceId) {
            await Service.deleteOne({ _id: serviceId });
        }
        if (email) {
            await User.deleteOne({ email: email });
        }
    });
});
