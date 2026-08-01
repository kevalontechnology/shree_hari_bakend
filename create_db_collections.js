require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const { Buyer, Manufacturer, Port, Exporter, Product, RangeData } = require('./models/ReferenceData');
const Shipment = require('./models/Shipment');
const Template = require('./models/Template');
const TemplateData = require('./models/TemplateData');
const TemplateElement = require('./models/TemplateElement');
const User = require('./models/User');
const Notification = require('./models/Notification');

const createCollections = async () => {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create collections for each model
    await Buyer.createCollection();
    console.log('Collection Buyer created');

    await Manufacturer.createCollection();
    console.log('Collection Manufacturer created');

    await Port.createCollection();
    console.log('Collection Port created');

    await Exporter.createCollection();
    console.log('Collection Exporter created');

    await Product.createCollection();
    console.log('Collection Product created');

    await RangeData.createCollection();
    console.log('Collection RangeData created');

    await Shipment.createCollection();
    console.log('Collection Shipment created');

    await Template.createCollection();
    console.log('Collection Template created');

    await TemplateData.createCollection();
    console.log('Collection TemplateData created');

    await TemplateElement.createCollection();
    console.log('Collection TemplateElement created');

    await User.createCollection();
    console.log('Collection User created');

    await Notification.createCollection();
    console.log('Collection Notification created');

    console.log('All collections created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating collections:', error);
    process.exit(1);
  }
};

createCollections();
