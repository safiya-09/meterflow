const Api = require('../models/api.model');

/**
 * CREATE API
 */
exports.createApi = async (req, res) => {
    try {
        const { name, description, baseUrl, version } = req.body;

        if (!name || !description || !baseUrl) {
            return res.status(400).json({
                success: false,
                message: 'name, description and baseUrl are required'
            });
        }

        const api = await Api.create({
            userId: req.user.id,
            name,
            description,
            baseUrl,
            version: version || 'v1'
        });

        res.status(201).json({
            success: true,
            data: api
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET ALL APIS
 */
exports.getApis = async (req, res) => {
    try {
        const query =
            req.user.role === 'admin'
                ? {}
                : { userId: req.user.id };

        const apis = await Api.find(query);

        res.status(200).json({
            success: true,
            count: apis.length,
            data: apis
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET SINGLE API
 */
exports.getApi = async (req, res) => {
    try {
        const api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({
                success: false,
                message: 'API not found'
            });
        }

        if (
            api.userId.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.json({
            success: true,
            data: api
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * UPDATE API
 */
exports.updateApi = async (req, res) => {
    try {
        let api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({
                success: false,
                message: 'API not found'
            });
        }

        if (
            api.userId.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        api = await Api.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            success: true,
            data: api
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * DELETE API
 */
exports.deleteApi = async (req, res) => {
    try {
        const api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({
                success: false,
                message: 'API not found'
            });
        }

        if (
            api.userId.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await api.deleteOne();

        res.json({
            success: true,
            message: 'API deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};