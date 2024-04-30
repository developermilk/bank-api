const KrungsriBizOnlineModel = require('../models/krungsriBizOnlineModel');

exports.transfer = async (req, res) => {
    try {
        const { acc_to, bankcode, amount, username, password } = req.body;

        // Validate request data
        if (!acc_to || !bankcode || !amount || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const krungsri = new KrungsriBizOnlineModel(username, password);
        const login = await krungsri.login();

        if (login.status === 200) {
            const result = await krungsri.transfer(acc_to, krungsri.getBankCode(bankcode), amount);
            return res.status(result.status).json(result);
        } else {
            return res.status(login.status).json(login);
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getStatement = async (req, res) => {
    try {
        const { username, password, startDate, endDate, next } = req.body;

        // Validate request data
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const krungsri = new KrungsriBizOnlineModel(username, password);
        const login = await krungsri.login();

        if (login.status === 200) {
            const statement = await krungsri.getStatement(startDate, endDate, next);
            return res.status(200).json(statement);
        } else {
            return res.status(login.status).json(login);
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPortfolio = async (req, res) => {
    try {
        const { username, password, startDate, endDate, next } = req.body;

        // Validate request data
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const krungsri = new KrungsriBizOnlineModel(username, password);
        const login = await krungsri.login();

        if (login.status === 200) {
            const MyPortfolio = await krungsri.MyPortfolio();
            return res.status(200).json(MyPortfolio);
        } else {
            return res.status(login.status).json(login);
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBankList = async (req, res) => {
    try {
        const krungsri = new KrungsriBizOnlineModel();
        return res.status(200).json(krungsri.getBankList());

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
