'use strict';

const Subject = require('../models/Subject');
const { createError } = require('../middleware/errorHandler');
const { paginationMeta, parseSortString } = require('../utils/helpers');

class SubjectService {
  async getAll({ page = 1, limit = 20, isActive, department, semester, search, sort = 'name' }) {
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (department) filter.department = new RegExp(department, 'i');
    if (semester) filter.semester = Number(semester);
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    const [subjects, total] = await Promise.all([
      Subject.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Subject.countDocuments(filter),
    ]);

    return {
      subjects: subjects.map((s) => s.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }

  async getById(id) {
    const subject = await Subject.findById(id);
    if (!subject) throw createError('Subject not found', 404);
    return subject.toJSON();
  }

  async create(data) {
    const existing = await Subject.findOne({ code: data.code.toUpperCase() });
    if (existing) throw createError(`Subject code "${data.code}" already exists`, 409);

    const subject = await Subject.create(data);
    return subject.toJSON();
  }

  async update(id, data) {
    if (data.code) {
      const existing = await Subject.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) throw createError(`Subject code "${data.code}" already in use`, 409);
    }

    const subject = await Subject.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!subject) throw createError('Subject not found', 404);
    return subject.toJSON();
  }

  async delete(id) {
    console.log(`[SERVICE DEBUG] Calling findByIdAndDelete for ID: ${id}`);
    const subject = await Subject.findByIdAndDelete(id);
    
    if (!subject) {
      console.log(`[SERVICE DEBUG] No subject found with ID: ${id}`);
      throw createError('Subject not found', 404);
    }
    
    console.log(`[SERVICE DEBUG] Successfully deleted subject: ${subject.code}`);
    return { message: 'Subject deleted successfully' };
  }
}

module.exports = new SubjectService();
