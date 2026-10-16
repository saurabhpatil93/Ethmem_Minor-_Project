// Minimal shadcn-style `cn` utility used to compose class names.
// Keeps things tiny and dependency-free for this project.
export function cn(...inputs) {
  // Flatten 1 level and filter falsy values
  const classes = [];
  for (const i of inputs) {
    if (!i) continue;
    if (Array.isArray(i)) classes.push(...i);
    else if (typeof i === 'object') {
      // support object like { 'class-name': condition }
      for (const [key, val] of Object.entries(i)) if (val) classes.push(key);
    } else classes.push(i);
  }
  return classes.join(' ');
}
