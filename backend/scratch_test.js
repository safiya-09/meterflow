const express = require('express');
const app = express();
const router = express.Router();

app.use('/gateway', router);

router.use('/:apiId', (req, res) => {
    console.log('req.params:', req.params);
    console.log('req.url:', req.url);
    console.log('req.originalUrl:', req.originalUrl);
    console.log('req.path:', req.path);
    res.json({
        params: req.params,
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.path
    });
});

app.listen(3000, () => {
    console.log('Server running on 3000');
});
