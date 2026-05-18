import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'Acquisitions-Architecture.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 56, bottom: 56, left: 56, right: 56 },
  info: {
    Title: 'Acquisitions API — Architecture Explainer',
    Author: 'Acquisitions Project',
    Subject: 'Codebase architecture documentation',
  },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const colors = {
  primary: '#1a365d',
  secondary: '#2c5282',
  text: '#1a202c',
  muted: '#4a5568',
  accent: '#2b6cb0',
  line: '#e2e8f0',
};

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

function checkPage(needed = 80) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

function drawTitle(text) {
  checkPage(100);
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(colors.primary)
    .text(text, { width: pageWidth });
  doc.moveDown(0.4);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(colors.accent)
    .lineWidth(2)
    .stroke();
  doc.moveDown(0.8);
}

function drawSection(num, title) {
  checkPage(60);
  doc.moveDown(0.5);
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(colors.secondary)
    .text(`${num}. ${title}`, { width: pageWidth });
  doc.moveDown(0.35);
}

function drawSubsection(title) {
  checkPage(40);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.text)
    .text(title, { width: pageWidth });
  doc.moveDown(0.2);
}

function drawBody(text, options = {}) {
  checkPage(30);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.text)
    .text(text, {
      width: pageWidth,
      align: 'left',
      lineGap: 3,
      ...options,
    });
  doc.moveDown(0.25);
}

function drawBullet(items) {
  items.forEach(item => {
    checkPage(24);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(colors.text)
      .text(`•  ${item}`, {
        width: pageWidth,
        indent: 12,
        lineGap: 2,
      });
  });
  doc.moveDown(0.2);
}

function drawCodeBlock(text) {
  checkPage(120);
  const startY = doc.y;
  doc
    .rect(doc.page.margins.left, startY, pageWidth, 0)
    .fillColor('#f7fafc');
  doc
    .font('Courier')
    .fontSize(8)
    .fillColor('#2d3748')
    .text(text, {
      width: pageWidth - 16,
      x: doc.page.margins.left + 8,
      y: startY + 8,
      lineGap: 2,
    });
  doc.moveDown(0.5);
}

function drawTable(headers, rows) {
  const colCount = headers.length;
  const colWidth = pageWidth / colCount;
  const rowHeight = 18;
  let y = doc.y;

  checkPage(rowHeight * (rows.length + 2));

  headers.forEach((h, i) => {
    doc
      .rect(doc.page.margins.left + i * colWidth, y, colWidth, rowHeight)
      .fillAndStroke('#edf2f7', colors.line);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(colors.text)
      .text(h, doc.page.margins.left + i * colWidth + 4, y + 5, {
        width: colWidth - 8,
      });
  });
  y += rowHeight;

  rows.forEach(row => {
    row.forEach((cell, i) => {
      doc
        .rect(doc.page.margins.left + i * colWidth, y, colWidth, rowHeight)
        .stroke(colors.line);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.text)
        .text(String(cell), doc.page.margins.left + i * colWidth + 4, y + 5, {
          width: colWidth - 8,
        });
    });
    y += rowHeight;
  });
  doc.y = y + 8;
}

// Cover
doc
  .font('Helvetica-Bold')
  .fontSize(28)
  .fillColor(colors.primary)
  .text('Acquisitions API', { align: 'center' });
doc.moveDown(0.3);
doc
  .font('Helvetica')
  .fontSize(16)
  .fillColor(colors.muted)
  .text('Architecture Explainer', { align: 'center' });
doc.moveDown(1.2);
doc
  .font('Helvetica')
  .fontSize(10)
  .fillColor(colors.muted)
  .text('Codebase architecture and how it works', { align: 'center' });
doc.moveDown(2);
doc
  .font('Helvetica')
  .fontSize(9)
  .fillColor(colors.muted)
  .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    align: 'center',
  });

doc.addPage();

// 1. Big Picture
drawSection('1', 'Identify the Big Picture');
drawSubsection('What type of project is this?');
drawBody(
  'A Node.js REST API named Acquisitions. It is a backend HTTP service (not a full web app or CLI). Clients call it over JSON; there is no frontend in this repository.'
);
drawSubsection('What problem does it solve?');
drawBody(
  'It is meant to back an acquisitions product (tracking deals, companies, or similar). Today the repository is an auth foundation: user registration, with sign-in and sign-out stubbed. The workspace path suggests Docker containerization may follow; there is no Dockerfile in the repo yet.'
);

// 2. Core Architecture
drawSection('2', 'Core Architecture');
drawSubsection('Style');
drawBody(
  'Layered monolith — one Express app, one process, with clear separation of concerns: routes → controllers → services → database.'
);
drawSubsection('High-level flow');
drawCodeBlock(
  'HTTP Client\n    |\n    v\nExpress App (helmet, cors, json, cookies, morgan, Arcjet)\n    |\n    +-- /, /health, /api\n    +-- /api/auth/*  -->  Routes --> Controllers --> Services --> Neon Postgres'
);
drawSubsection('Folder layout');
drawTable(
  ['Path', 'Role'],
  [
    ['src/index.js', 'Entry: imports server.js'],
    ['src/server.js', 'Binds HTTP port'],
    ['src/app.js', 'Express setup, middleware, routes'],
    ['src/routes/', 'URL to handler wiring'],
    ['src/controllers/', 'HTTP: validate, status codes, responses'],
    ['src/services/', 'Business logic (passwords, JWT, DB)'],
    ['src/models/', 'Drizzle schema (Postgres tables)'],
    ['src/validations/', 'Zod request schemas'],
    ['src/middleware/', 'Cross-cutting (Arcjet security)'],
    ['src/config/', 'DB, logger, Arcjet client'],
    ['drizzle/', 'Generated SQL migrations'],
  ]
);

doc.addPage();

// 3. Key Components
drawSection('3', 'Key Components');
drawSubsection('Application shell (app.js)');
drawBullet([
  'Helmet — security headers',
  'CORS — cross-origin requests',
  'express.json / urlencoded — body parsing',
  'cookie-parser — reads token cookie',
  'Morgan — HTTP logs forwarded to Winston',
  'securityMiddleware — Arcjet rate limit, bots, shield',
]);

drawSubsection('Auth routes');
drawTable(
  ['Method', 'Path', 'Status'],
  [
    ['POST', '/api/auth/signup', 'Implemented'],
    ['POST', '/api/auth/signin', 'Stub'],
    ['POST', '/api/auth/signout', 'Stub'],
  ]
);

drawSubsection('Auth service');
drawBullet([
  'hashPassword / comparePassword — bcrypt (cost 10)',
  'generateToken — JWT with id, email, role (1h expiry)',
  'createUser — duplicate check, hash, insert via Drizzle',
]);

drawSubsection('Data layer');
drawBody(
  'database.js connects Neon serverless driver with Drizzle HTTP client. user.model.js defines users table: id, name, email, password, role, created_at, updated_at.'
);

drawSubsection('Security (Arcjet)');
drawBody(
  'Global rules: shield, bot detection (allows search engines, previews, Postman), sliding window (5 req / 2s). Per-request middleware adds role-based limits: guest 5/min, user 10, admin 100. Note: req.user is not set yet, so everyone is treated as guest.'
);

doc.addPage();

// 4. Data Flow
drawSection('4', 'Data Flow & Communication');
drawSubsection('Signup flow (implemented)');
drawCodeBlock(
  'Client -> Express -> securityMiddleware -> signup controller\n  -> Zod validation -> createUser service\n  -> SELECT email -> INSERT user -> generateToken\n  -> Set-Cookie + 201 JSON response'
);
drawSubsection('Discovery endpoints');
drawBullet([
  'GET / — welcome message',
  'GET /health — status, timestamp, uptime',
  'GET /api — API alive check',
]);
drawBody(
  'No service-to-service calls. Only client ↔ API ↔ database and API ↔ Arcjet (in-process SDK).'
);

// 5. Tech Stack
drawSection('5', 'Tech Stack & Dependencies');
drawTable(
  ['Technology', 'Role'],
  [
    ['Node.js (ES modules)', 'Runtime'],
    ['Express 5', 'HTTP server, routing, middleware'],
    ['Drizzle ORM', 'Schema, queries, migrations'],
    ['Neon serverless', 'Postgres over HTTP'],
    ['Zod', 'Request validation'],
    ['bcrypt', 'Password hashing'],
    ['jsonwebtoken', 'Auth tokens'],
    ['cookie-parser', 'Cookie-based session token'],
    ['Winston + Morgan', 'Logging'],
    ['Helmet + CORS', 'HTTP hardening'],
    ['Arcjet', 'Rate limiting, bots, attack shield'],
    ['dotenv', 'Environment configuration'],
  ]
);

doc.addPage();

// 6. Execution Flow
drawSection('6', 'Execution Flow — User Signup');
drawBullet([
  'Client sends POST /api/auth/signup with JSON body.',
  'Request passes Helmet, CORS, parsers, cookie-parser, Morgan.',
  'securityMiddleware runs Arcjet; may return 403 or 429.',
  'authRouter delegates to signup controller.',
  'signupSchema.safeParse — on failure returns 400.',
  'createUser checks email, hashes password, inserts row.',
  'generateToken builds JWT; cookies.set sets HTTP-only cookie.',
  'Response: 201 with message, user object, and token.',
]);

drawSubsection('Example request');
drawCodeBlock(
  'POST /api/auth/signup\nContent-Type: application/json\n\n{\n  "name": "Jane Doe",\n  "email": "jane@example.com",\n  "password": "secret12",\n  "role": "user"\n}'
);

drawSubsection('Example success response');
drawCodeBlock(
  'HTTP/1.1 201 Created\nSet-Cookie: token=<jwt>; HttpOnly; SameSite=Strict\n\n{\n  "message": "User registered successfully.",\n  "user": { "id": 1, "name": "Jane Doe", ... },\n  "token": "<jwt>"\n}'
);

// 7. Strengths & Tradeoffs
drawSection('7', 'Strengths & Tradeoffs');
drawSubsection('Strengths');
drawBullet([
  'Clear layering — easy to add acquisition routes beside auth.',
  'Import maps — clean internal imports without deep relative paths.',
  'Schema + migrations — Drizzle keeps DB and code in sync.',
  'Security-minded defaults — Helmet, Arcjet, bcrypt, HTTP-only cookies.',
  'Observability — Winston, Morgan, dedicated /health endpoint.',
  'Serverless-friendly DB — Neon HTTP driver fits edge deploys.',
]);

drawSubsection('Limitations & watch-outs');
drawBullet([
  'Incomplete auth — sign-in/sign-out are placeholders; no auth middleware.',
  'req.user never set — role-based Arcjet limits always use guest.',
  'Duplicate JWT paths — auth.service (1h) vs utils/jwt.js (1d).',
  'createUser catch block may mask EMAIL_ALREADY_EXISTS errors.',
  'Security middleware — audit return after every Arcjet denial.',
  'No Docker yet — containerization may be planned for course.',
  'Acquisitions domain — no acquisition entities/routes yet.',
]);

doc.addPage();

// 8. Summary
drawSection('8', 'Final Summary');
drawBody(
  'Acquisitions is a small Express 5 REST API structured as routes → controllers → services → Drizzle/Neon, focused today on user signup with Zod validation, bcrypt, JWT + cookies, and Arcjet rate limiting and bot protection. It is a monolithic backend ready to grow with acquisition-specific endpoints once auth (sign-in, JWT middleware, req.user) is finished.'
);
doc.moveDown(0.5);
drawSubsection('Elevator pitch');
drawBody(
  'It is a Node/Express API for an acquisitions product, wired to Neon Postgres through Drizzle. Right now it only fully implements signup with JWT cookies and Arcjet security; sign-in and the actual acquisitions features are still to come. Think of it as the secured auth shell you will hang the rest of the API on.'
);

// Footer on last page
doc
  .font('Helvetica')
  .fontSize(8)
  .fillColor(colors.muted)
  .text('Acquisitions API — Architecture Explainer', 56, doc.page.height - 40, {
    align: 'center',
    width: pageWidth,
  });

doc.end();

stream.on('finish', () => {
  console.log(`PDF saved to: ${outputPath}`);
});

stream.on('error', err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
