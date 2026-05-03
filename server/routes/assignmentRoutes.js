import express from "express";

const router = express.Router();

// 📌 GET all assignments
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Fetched all assignments",
    data: []
  });
});

// 📌 GET single assignment by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Fetched assignment with id ${id}`,
    data: { id }
  });
});

// 📌 CREATE new assignment
router.post("/", (req, res) => {
  const assignment = req.body;

  res.status(201).json({
    success: true,
    message: "Assignment created",
    data: assignment
  });
});

// 📌 UPDATE assignment
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  res.json({
    success: true,
    message: `Assignment ${id} updated`,
    data: updatedData
  });
});

// 📌 DELETE assignment
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Assignment ${id} deleted`
  });
});

export default router;