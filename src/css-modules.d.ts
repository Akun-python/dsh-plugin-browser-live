/** CSS Modules typing (the client tsconfig resolves `*.module.css` imports). */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}