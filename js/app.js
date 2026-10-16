const loginForm =
  document.getElementById("loginForm");

const errorMessage =
  document.getElementById(
    "errorMessage"
  );

loginForm.addEventListener(
  "submit",
  function(event){

    event.preventDefault();

    const email =
      document
      .getElementById("email")
      .value;

    const password =
      document
      .getElementById("password")
      .value;

    errorMessage.style.display =
      "none";

    /*
      仮ログイン

      本番ではAPI認証に変更
    */

    if(
      email ===
      "admin@example.com"
      &&
      password ===
      "password123"
    ){

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      localStorage.setItem(
        "userEmail",
        email
      );

      alert("ログイン成功");

      // location.href =
      // "dashboard.html";

    }else{

      errorMessage.style.display =
        "block";

    }

  }
);
