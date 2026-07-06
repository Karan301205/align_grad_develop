const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const { prisma } = require('./config/db');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api', apiRoutes);

app.get('/health', async (req, res) => {
  try {
    // Perform a lightweight database operation to verify connectivity (e.g. check user count)
    await prisma.user.count();
    res.json({ status: 'OK', services: { api: 'ACTIVE', database: 'ACTIVE' }, timestamp: new Date() });
  } catch (error) {
    console.error('Database connection failed in health check:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      services: { api: 'ACTIVE', database: 'INACTIVE' }, 
      error: error.message, 
      timestamp: new Date() 
    });
  }
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
