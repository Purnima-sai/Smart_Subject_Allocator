const express = require('express');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/adminController');

const uploadDir = path.join(__dirname, '..', 'uploads');
// Ensure uploads directory exists to prevent ENOENT on Windows/OneDrive paths
try {
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
		// eslint-disable-next-line no-console
		console.log('[adminRoutes] Created uploads directory at', uploadDir);
	}
} catch (e) {
	// eslint-disable-next-line no-console
	console.error('[adminRoutes] Failed to ensure uploads directory:', e.message);
}
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// student CSV upload (admin only)
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
router.post('/upload-students', authenticate, authorizeRoles('admin'), upload.single('file'), adminController.uploadStudents);

// upload students with preferences CSV (admin only) - comprehensive upload
router.post('/upload-students-with-preferences', authenticate, authorizeRoles('admin'), upload.single('file'), adminController.uploadStudentsWithPreferences);

// Subject CRUD (admin only)
router.post('/subjects', authenticate, authorizeRoles('admin'), adminController.createSubject);
router.get('/subjects', authenticate, authorizeRoles('admin'), adminController.listSubjects);
router.put('/subjects/:id', authenticate, authorizeRoles('admin'), adminController.updateSubject);
router.delete('/subjects/:id', authenticate, authorizeRoles('admin'), adminController.deleteSubject);
// seed sample subjects (admin only)
router.post('/subjects/seed', authenticate, authorizeRoles('admin'), adminController.seedDefaults);
// admin utilities
router.post('/subjects/backfill-codes', authenticate, authorizeRoles('admin'), adminController.backfillSubjectCodes);
router.delete('/subjects', authenticate, authorizeRoles('admin'), adminController.clearAllSubjects);

// exports (admin only)
router.get('/export-allotments', authenticate, authorizeRoles('admin'), adminController.exportAllotments);
router.get('/export-allocation-csv', authenticate, authorizeRoles('admin'), adminController.exportAllocationCSV);

// get registered student preferences (admin only)
router.get('/registered-electives', authenticate, authorizeRoles('admin'), adminController.getRegisteredElectives);

// upload student preferences CSV (admin only)
router.post('/upload-preferences', authenticate, authorizeRoles('admin'), upload.single('file'), adminController.uploadPreferencesCSV);

// run allocation algorithm (admin only)
router.post('/run-allocation', authenticate, authorizeRoles('admin'), adminController.runAllocationAlgorithm);

// faculty allocation routes (admin only)
router.post('/allocate-faculty', authenticate, authorizeRoles('admin'), adminController.allocateFaculty);
router.get('/export-faculty-allocation-csv', authenticate, authorizeRoles('admin'), adminController.exportFacultyAllocationCSV);

module.exports = router;
