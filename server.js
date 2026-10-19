require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'projects.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Proposed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);

const seedCount = db.prepare('SELECT COUNT(*) AS n FROM projects').get().n;
if (seedCount === 0) {
  const seed = db.prepare(`INSERT INTO projects
    (project_title, student_name, category, description, status)
    VALUES (?, ?, ?, ?, ?)`);
  const examples = [
    ['Solar-Powered Phone Charger','Chanda Mwansa','Energy','Build a small solar charger for mobile devices.','In Progress'],
    ['Water Purification Filter','Mwamba Phiri','Environment','Test low-cost materials for filtering water.','Proposed'],
    ['Smart Irrigation System','Leya Banda','Agriculture','Use soil moisture readings to guide watering.','In Progress'],
    ['Plastic Bottle Eco-Bricks','John Zulu','Environment','Study reuse of plastic bottles in construction.','Completed'],
    ['Biogas from Food Waste','Ruth Tembo','Energy','Explore biogas production from organic waste.','Proposed'],
    ['Rainwater Harvesting Model','Peter Chileshe','Engineering','Create a model for collecting rainwater.','In Progress'],
    ['Plant Growth Under Different Light','Grace Phiri','Biology','Compare plant growth under different light conditions.','Completed'],
    ['Low-Cost Flood Alert','Brian Lungu','Technology','Prototype a water-level alert device.','Proposed'],
    ['Natural Mosquito Repellent','Misozi Kapasa','Health','Compare plant-based mosquito repellent methods.','In Progress'],
    ['School Waste Sorting Bin','Tapiwa Bwalya','Environment','Design bins to encourage waste separation.','Completed']
  ];
  const transaction = db.transaction(rows => rows.forEach(row => seed.run(...row)));
  transaction(examples);
}

app.use(cors());
app.use(express.json({limit:'100kb'}));

const allowedStatuses = new Set(['Proposed','In Progress','Completed']);
function validate(body) {
  const errors = [];
  for (const key of ['project_title','student_name','category','description']) {
    if (typeof body[key] !== 'string' || !body[key].trim()) errors.push(`${key} is required`);
  }
  if (body.status !== undefined && !allowedStatuses.has(body.status)) {
    errors.push('status must be Proposed, In Progress, or Completed');
  }
  return errors;
}
function normalize(body) {
  return {
    project_title: body.project_title.trim(),
    student_name: body.student_name.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status || 'Proposed'
  };
}
function getProject(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

app.get('/api/projects', (_req,res) => {
  const data = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json({success:true,count:data.length,data});
});
app.get('/api/projects/:id', (req,res) => {
  const item = getProject(Number(req.params.id));
  if (!item) return res.status(404).json({success:false,message:'Project not found'});
  res.json({success:true,data:item});
});
app.post('/api/projects', (req,res) => {
  const errors = validate(req.body || {});
  if (errors.length) return res.status(400).json({success:false,errors});
  const item = normalize(req.body);
  const result = db.prepare(`INSERT INTO projects
    (project_title,student_name,category,description,status) VALUES
    (@project_title,@student_name,@category,@description,@status)`).run(item);
  res.status(201).json({success:true,message:'Project created',data:getProject(result.lastInsertRowid)});
});
app.put('/api/projects/:id', (req,res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({success:false,message:'Invalid project ID'});
  if (!getProject(id)) return res.status(404).json({success:false,message:'Project not found'});
  const errors = validate(req.body || {});
  if (errors.length) return res.status(400).json({success:false,errors});
  const item = normalize(req.body);
  db.prepare(`UPDATE projects SET project_title=@project_title, student_name=@student_name,
    category=@category, description=@description, status=@status, updated_at=CURRENT_TIMESTAMP
    WHERE id=@id`).run({...item,id});
  res.json({success:true,message:'Project updated',data:getProject(id)});
});
app.delete('/api/projects/:id', (req,res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({success:false,message:'Project not found'});
  res.json({success:true,message:'Project deleted',id});
});
app.get('/api/health', (_req,res) => res.json({success:true,message:'ICT251 API is running'}));

// Serve the frontend and API from the same host so no URL editing is needed.
app.use(express.static(__dirname));
app.get('/', (_req,res) => res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`ICT251 app listening on ${PORT}`));
