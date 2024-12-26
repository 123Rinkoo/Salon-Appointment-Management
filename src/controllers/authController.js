const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../utils/paseto');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields (name, email, password, role).' });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });


        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {

        console.error(error);
        res.status(500).json({ message: 'An error occurred while registering the user.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = await generateToken({ id: user._id, role: user.role });

        return res.json({ token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
