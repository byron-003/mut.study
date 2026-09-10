import express from 'express';
import { search, autocomplete } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', search);
router.get('/autocomplete', autocomplete);

export default router;
