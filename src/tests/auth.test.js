// jest is the testing framework.
// supertest is used for making HTTP requests in your test cases.
// Use beforeAll and afterAll Hooks for Cleanup
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Endpoints', () => {

    beforeAll(async () => {
        await User.deleteMany({ email: /test@example.com/ });
    });

    // Test for successful registration
    it('should register a new user', async () => {
        const res = await request(app).post('/auth/register').send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'Customer',
        });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe('User registered successfully');
    });

    // Test for missing fields
    it('should return an error if required fields are missing', async () => {
        const res = await request(app).post('/auth/register').send({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Please provide all required fields (name, email, password, role).');
    });

    // Test for email already in use
    it('should return an error if the email is already in use', async () => {
        // First, register a user
        await request(app).post('/auth/register').send({
            name: 'Existing User',
            email: 'test@example.com',
            password: 'password123',
            role: 'Customer',
        });

        // Try to register again with the same email
        const res = await request(app).post('/auth/register').send({
            name: 'New User',
            email: 'test@example.com',
            password: 'newpassword456',
            role: 'Customer',
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Email is already in use.');
    });

    // Test for invalid email format
    it('should return an error if the email format is invalid', async () => {
        const res = await request(app).post('/auth/register').send({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123',
            role: 'Customer',
        });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid email format.');
    });

    // Test for successful login
    it('should login a user with valid credentials', async () => {
        // Login with valid credentials
        const res = await request(app).post('/auth/login').send({
            email: 'test@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
    
    // Test for invalid login credentials (incorrect password)
    it('should return an error if the password is incorrect', async () => {
        
        const res = await request(app).post('/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword',
        });

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid credentials');
    });

    // Test for invalid login credentials (incorrect email)
    it('should return an error if the email is not registered', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'nonexistent@example.com',
            password: 'password123',
        });

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid credentials');
    });

    // Test for missing fields in login
    it('should return an error if email or password is missing', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'login@example.com',
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Email and password are required');
    });


    afterAll(async () => {
        await User.deleteMany({ email: /test@example.com/ }); // Deletes only the test users
    });
});
