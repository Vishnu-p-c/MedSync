const User = require('../models/User');
const HospitalAdmin = require('../models/HospitalAdmin');
const Hospital = require('../models/Hospital');
const bcrypt = require('bcrypt');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    const user = await User.findOne({ user_id: parseInt(user_id) }).select('-password_hash');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { user_id, first_name, last_name, email, phone, address, date_of_birth, gender } = req.body;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        user_id: { $ne: parseInt(user_id) } 
      });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already in use'
        });
      }
    }

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (date_of_birth) updateData.date_of_birth = date_of_birth;
    if (gender) updateData.gender = gender;

    const user = await User.findOneAndUpdate(
      { user_id: parseInt(user_id) },
      { $set: updateData },
      { new: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update localStorage userName if name changed
    const fullName = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        fullName: fullName
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;

    if (!user_id || !current_password || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID, current password, and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({ user_id: parseInt(user_id) });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await User.findOneAndUpdate(
      { user_id: parseInt(user_id) },
      { $set: { password_hash: newPasswordHash } }
    );

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
};

// Get hospital info for admin
const getHospitalInfo = async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin ID is required'
      });
    }

    // Find hospital admin
    const hospitalAdmin = await HospitalAdmin.findOne({ user_id: parseInt(admin_id) });
    
    if (!hospitalAdmin) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital admin not found'
      });
    }

    // Find hospital
    const hospital = await Hospital.findOne({ hospital_id: hospitalAdmin.hospital_id });

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        hospital_id: hospital.hospital_id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone || '',
        email: hospital.email || '',
        district: hospital.district,
        latitude: hospital.latitude,
        longitude: hospital.longitude
      }
    });
  } catch (error) {
    console.error('Error fetching hospital info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hospital info'
    });
  }
};

// Update hospital info (admin only)
const updateHospitalInfo = async (req, res) => {
  try {
    const { admin_id, name, address, phone, email, district } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin ID is required'
      });
    }

    // Find hospital admin
    const hospitalAdmin = await HospitalAdmin.findOne({ user_id: parseInt(admin_id) });
    
    if (!hospitalAdmin) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital admin not found'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (district) updateData.district = district;

    const hospital = await Hospital.findOneAndUpdate(
      { hospital_id: hospitalAdmin.hospital_id },
      { $set: updateData },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Hospital info updated successfully',
      data: {
        hospital_id: hospital.hospital_id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone || '',
        email: hospital.email || '',
        district: hospital.district
      }
    });
  } catch (error) {
    console.error('Error updating hospital info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update hospital info'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getHospitalInfo,
  updateHospitalInfo
};
