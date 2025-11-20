const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Subject management (admin only)
router.get('/', authenticate, adminController.listSubjects);
router.post('/', authenticate, authorizeRoles('admin'), adminController.createSubject);
router.put('/:id', authenticate, authorizeRoles('admin'), adminController.updateSubject);
router.delete('/:id', authenticate, authorizeRoles('admin'), adminController.deleteSubject);

module.exports = router;
