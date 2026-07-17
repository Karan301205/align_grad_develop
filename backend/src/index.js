const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const { prisma } = require('./config/db');

// Triggering nodemon reload to load the updated Prisma Client schema: reload 2
dotenv.config();

const app = express();

app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use('/api/upload/secure-put', express.raw({ limit: '60mb', type: '*/*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

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


const errorHandler = require('./middleware/errorHandler');

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
