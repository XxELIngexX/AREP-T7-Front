

document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href =
    "https://us-east-1rgr4mlkxk.auth.us-east-1.amazoncognito.com/login" +
    "?client_id=5miflgkc4h2edf4h3408u77c36" +
    "&response_type=code" +
    "&scope=email+openid+profile" +
    "&redirect_uri=https://xxelingexx.github.io/AREP-T7-Front/profileCreator";
});

document.getElementById("signupBtn").addEventListener("click", () => {
  });



