const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const requestService = require('./request.service');
const employeeService = require('./employee.service');

// routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:id', authorize(), getByEmployeeId);
router.post('/', authorize(), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.put('/:id/status', authorize(), changeStatusSchema, changeStatus);
router.delete('/:id', authorize(), _delete);

module.exports = router;

function getAll(req, res, next) {
    requestService.getAll()
        .then(requests => res.json(requests))
        .catch(next);
}

function getById(req, res, next) {
    // First get the request
    requestService.getById(req.params.id)
        .then(request => {
            // For admin and moderators, allow access to any request
            if (req.user.role === Role.Admin || req.user.role === Role.Moderator) {
                return res.json(request);
            }
            
            // For regular users, check if they own the request
            // We need to get their employee ID first
            employeeService.getByAccountId(req.user.id)
                .then(employee => {
                    // Regular users can only view their own requests
                    if (request.employeeId != employee.id) {
                        return res.status(401).json({ message: 'Unauthorized' });
                    }
                    res.json(request);
                })
                .catch(error => {
                    console.error('Error getting employee by account ID:', error);
                    return res.status(401).json({ message: 'Unauthorized - No employee record found' });
                });
        })
        .catch(next);
}

function getByEmployeeId(req, res, next) {
    // First, check if the user has an employee record
    employeeService.getByAccountId(req.user.id)
        .then(employee => {
            // Users can only view their own requests (by employeeId)
            // Admins and moderators can view all requests
            if (req.params.id != employee.id && 
                req.user.role !== Role.Admin && req.user.role !== Role.Moderator) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            
            requestService.getByRequesterId(req.params.id)
                .then(requests => res.json(requests))
                .catch(next);
        })
        .catch(error => {
            // If no employee record found for this user or other error
            console.error('Error getting employee by account ID:', error);
            return res.status(401).json({ message: 'Unauthorized - No employee record found' });
        });
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().valid('Equipment', 'Leave', 'Resources').required(),
        employeeId: Joi.number().required(),
        items: Joi.when('type', {
            is: 'Leave',
            then: Joi.array().items(Joi.object({
                name: Joi.string().max(100),
                quantity: Joi.number().integer().min(1)
            })).optional().default([]),
            otherwise: Joi.array().items(Joi.object({
                name: Joi.string().required().max(100),
                quantity: Joi.number().integer().min(1).required()
            })).min(1).required()
        }),
        isAdmin: Joi.boolean().optional()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    requestService.create(req.body)
        .then(request => res.json(request))
        .catch(error => {
            // Add more detailed error response
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    details: error.errors
                });
            }
            next(error);
        });
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().valid('Equipment', 'Leave', 'Resources'),
        status: Joi.string().valid('Pending', 'Approved', 'Rejected'),
        items: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })).default([])
    }).min(1);
    validateRequest(req, next, schema);
}

async function update(req, res, next) {
    try {
        const request = await requestService.getById(req.params.id);
        
        // For admin and moderators, allow updates to any request
        if (req.user.role === Role.Admin || req.user.role === Role.Moderator) {
            const updatedRequest = await requestService.update(req.params.id, req.body);
            return res.json(updatedRequest);
        }
        
        // For regular users, check if they own the request
        const employee = await employeeService.getByAccountId(req.user.id);
        
        // Regular users can only update their own requests
        if (request.employeeId != employee.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const updatedRequest = await requestService.update(req.params.id, req.body);
        res.json(updatedRequest);
    } catch (error) {
        next(error);
    }
}

function changeStatusSchema(req, res, next) {
    const schema = Joi.object({
        status: Joi.string().valid('Pending', 'Submitted', 'In Progress', 'Approved', 'Rejected', 'Completed').required(),
        comments: Joi.string()
    });
    validateRequest(req, next, schema);
}

async function changeStatus(req, res, next) {
    try {
        const request = await requestService.getById(req.params.id);
        
        // For admin and moderators, allow status changes to any request
        if (req.user.role === Role.Admin || req.user.role === Role.Moderator) {
            const result = await requestService.changeStatus(req.params.id, {
                status: req.body.status,
                handledById: req.user.id,
                comments: req.body.comments
            });
            return res.json(result);
        }
        
        // For regular users, check if they own the request
        const employee = await employeeService.getByAccountId(req.user.id);
        
        // Regular users can only change status of their own requests
        if (request.employeeId != employee.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Regular users can only cancel their own requests
        if (req.body.status !== 'Cancelled') {
            return res.status(401).json({ message: 'Unauthorized: Can only cancel your own requests' });
        }
        
        const result = await requestService.changeStatus(req.params.id, {
            status: req.body.status,
            handledById: req.user.id,
            comments: req.body.comments
        });
        
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function _delete(req, res, next) {
    try {
        const request = await requestService.getById(req.params.id);
        
        // Admins can delete any request
        if (req.user.role === Role.Admin) {
            await requestService.delete(req.params.id);
            return res.json({ message: 'Request deleted successfully' });
        }
        
        // For regular users, check if they own the request
        const employee = await employeeService.getByAccountId(req.user.id);
        
        // Regular users can only delete their own requests
        if (request.employeeId != employee.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Regular users can only delete draft requests
        if (request.status !== 'Draft') {
            return res.status(401).json({ message: 'Unauthorized: Can only delete draft requests' });
        }
        
        await requestService.delete(req.params.id);
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        next(error);
    }
} 