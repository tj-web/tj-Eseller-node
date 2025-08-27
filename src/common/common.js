// // console.log(typeof null);
// // console.log(null instanceof Object);
// // console.log([] + []);
// // console.log([] + {});
// // console.log({} + []);
// // console.log([] == ![]);

// // console.log(Object.prototype);
// // console.log(Array.prototype);

// // import { spawn }from 'child_process';

// // const ls = spawn('ls', ['-lh', '/usr']); // List files in /usr

// // ls.stdout.on('data', (data) => {
// //   console.log(`Output: ${data}`);
// // });

// // ls.stderr.on('data', (data) => {
// //   console.error(`Error: ${data}`);
// // });

// // ls.on('close', (code) => {
// //   console.log(`Process exited with code ${code}`);
// // });
// import { exec } from "child_process";

// exec("uname -a", (err, stdout, stderr) => {
//   if (err) {
//     console.error("Error:", err);
//     return;
//   }
//   console.log("uname output:", stdout);
// });


