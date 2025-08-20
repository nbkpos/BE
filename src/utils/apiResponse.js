exports.ok = (res, data = {}, status = 200) => res.status(status).json({ success: true, ...data });
exports.err = (res, message = 'Error', status = 400) => res.status(status).json({ success: false, error: message });
