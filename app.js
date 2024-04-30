const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const krungsriBizOnlineController = require('./controllers/krungsriBizOnlineController');
const router = express();
const port = process.env.PORT || 6000;
router.use(cors());
router.use(bodyParser.json({ limit: "10mb" }));
router.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

router.use(bodyParser.json());

// Routes
router.post('/api/transfer', krungsriBizOnlineController.transfer);
router.post('/api/statement', krungsriBizOnlineController.getStatement);
router.post('/api/getPortfolio', krungsriBizOnlineController.getPortfolio);
router.get('/api/getBankList', krungsriBizOnlineController.getBankList);

router.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
