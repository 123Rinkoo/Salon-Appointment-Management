const checkAuthorization = (req, appointment) => {
    try {
        if (!appointment || !appointment.userId) {
            throw new Error('Invalid appointment data');
        }

        return req.user.role === 'Admin' || req.user.id === appointment.userId._id.toString();
    } catch (error) {
        console.error('Authorization Error:', error.message);
        return false;
    }
};

module.exports = { checkAuthorization };
