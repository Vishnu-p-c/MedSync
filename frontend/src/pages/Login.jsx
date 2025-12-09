function LoginPage() {
  return (
    <main>
      <section>
        <h1>Login</h1>

        <form>
          <div>
            <label>Email</label>
            <input type="email" placeholder="Enter your email" />
          </div>

          <div>
            <label>Password</label>
            <input type="password" placeholder="Enter your password" />
          </div>

          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
