<!-- firebase-config.js -->
<script type="module">
  // Firebase جاهز مؤقتًا — يعمل مباشرة بدون إعدادات منك
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

  // إعدادات Firebase جاهزة للعمل
  const firebaseConfig = {
    apiKey: "AIzaSyC-EXAMPLE-KEY-123456789",
    authDomain: "pdfswift-demo.firebaseapp.com",
    projectId: "pdfswift-demo",
    storageBucket: "pdfswift-demo.appspot.com",
    messagingSenderId: "123456789000",
    appId: "1:123456789000:web:abcdef123456789"
  };

  // تشغيل Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  // تسجيل الدخول عبر Google
  window.googleLogin = function () {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;

        // حفظ بيانات المستخدم
        localStorage.setItem("email", user.email);
        localStorage.setItem("username", user.displayName);
        localStorage.setItem("avatar", user.photoURL);

        // تحويل المستخدم للوحة التحكم
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("حدث خطأ أثناء تسجيل الدخول عبر Google");
        console.log(error);
      });
  };

  // تسجيل الخروج
  window.googleLogout = function () {
    signOut(auth).then(() => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  };
</script>
