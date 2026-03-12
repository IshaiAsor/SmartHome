export const renderAuthPage = (actionUrl: string, hiddenParams: Record<string, string>, error: string | null = null) => {
  const hiddenFields = Object.entries(hiddenParams)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
    .join('');

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Google Smart Home Auth</title>
    <style>
      body { font-family: Roboto, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8f9fa; }
      .container { background: white; padding: 24px 40px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); text-align: center; max-width: 400px; width: 100%; }
      h2 { color: #202124; font-size: 24px; font-weight: 400; margin-bottom: 16px; }
      p { color: #5f6368; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
      .btn { background-color: #1a73e8; color: white; padding: 10px 24px; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; transition: background-color 0.2s; }
      .btn:hover { background-color: #1765cc; }
      .input-group { text-align: left; margin-bottom: 15px; }
      .input-group label { display: block; margin-bottom: 5px; color: #5f6368; font-size: 14px; font-weight: 500; }
      .input-group input { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #dadce0; border-radius: 4px; font-size: 16px; }
      .error { color: #d93025; font-size: 14px; margin-bottom: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Link Account</h2>
      <p>Please sign in to link your <strong>Smart Home</strong> account.</p>
      ${error ? `<div class="error">${error}</div>` : ''}
      <form action="${actionUrl}" method="POST">
        ${hiddenFields}
        <div class="input-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit" class="btn">Sign In & Authorize</button>
      </form>
    </div>
  </body>
</html>
`;
};