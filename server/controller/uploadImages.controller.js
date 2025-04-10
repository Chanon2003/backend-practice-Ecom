import { cloudinary } from "../utils/cloudinary.js";

export const uploadImages = async (req, res) => {
  try {
    console.log('reqfiles',req.files)
    const uploadedImages = req.files.map(file => ({
      imageUrl: file.path,       // ลิงก์รูป
      publicId: file.filename,   // ID สำหรับใช้ลบ/อัปเดต
    }));
    
    res.json({ message: 'Images uploaded successfully', images: uploadedImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

export const updateImages = async (req, res) => {
  try {
    const { oldImages } = req.body; // รับ public_id ของรูปเดิมเป็น array

    // ลบรูปเก่าทิ้งก่อน
    if (oldImages && Array.isArray(JSON.parse(oldImages))) {
      for (const public_id of JSON.parse(oldImages)) {
        await cloudinary.uploader.destroy(public_id);
      }
    }

    // อัปโหลดรูปใหม่
    const uploadedImages = req.files.map(file => ({
      imageUrl: file.path,        // ลิงก์รูป
      publicId: file.filename,    // ID สำหรับใช้ลบ/อัปเดต
    }));

    // ส่งกลับผลลัพธ์เหมือนการอัปโหลด
    return res.json({ message: 'Images uploaded successfully', images: uploadedImages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Update failed' });
  }
};

export const deleteImages = async (req, res) => {
  try {
    const { public_ids } = req.body; // ค่าที่ส่งมาเป็น array ของ public_ids

    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({ message: 'Missing or invalid public_ids array' });
    }

    // ลบหลายๆ รูปพร้อมกัน
    await Promise.all(public_ids.map(id => cloudinary.uploader.destroy(id)));

    return res.json({ message: 'Images deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Delete failed' });
  }
};