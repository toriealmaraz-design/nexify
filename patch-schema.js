const fs = require('fs');
let s = fs.readFileSync('prisma/schema.prisma', 'utf8');

const old = `  nexaConversations NexaConversation[]

  @@map("users")
}

// ─── Core Entities ───────────────────────────────────────

model Waitlist {`;

const new = `  nexaConversations NexaConversation[]

  @@map("users")
  waitlists Waitlist[] @relation("WaitlistUser")
}

// ─── Core Entities ───────────────────────────────────────

model Waitlist {`;

if (s.includes(old)) {
  fs.writeFileSync('prisma/schema.prisma', s.replace(old, new));
  console.log('PATCHED');
} else {
  console.log('OLD NOT FOUND');
}
