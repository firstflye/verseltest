const { exec } = require('child_process');
const path = require('path');

console.log('Starting database installation...');

// Path to the install-db.ts script
const scriptPath = path.join(__dirname, 'server', 'install-db.ts');

// Run the script with ts-node
const command = `npx tsx ${scriptPath}`;
console.log(`Running command: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running the database installation script: ${error.message}`);
    console.error('Make sure XAMPP/MySQL is running before executing this script.');
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('Database installation completed successfully!');
  console.log('You can now start the application with npm run dev');
});