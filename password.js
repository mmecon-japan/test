function checkPassword() {
  const input = document.getElementById("password-input").value;
  const error = document.getElementById("error-message");

  if (input === "meiji2026") {
    document.getElementById("password-screen").style.display = "none";
    document.getElementById("main-content").style.display = "block";
  } else {
    error.textContent = "パスワードが違います";
  }
}
