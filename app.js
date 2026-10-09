/* My MCQs — shared app logic (no login, guest mode). PPSC-only site. */
(function(){
  "use strict";

  // Mobile menu
  var btn = document.getElementById("menuBtn"), nav = document.getElementById("mainNav");
  if(btn && nav){
    btn.addEventListener("click", function(){ nav.classList.toggle("open"); });
    nav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ nav.classList.remove("open"); });
    });
    // active link
    var page = location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("a").forEach(function(a){
      var href = a.getAttribute("href");
      if(href === page || (page === "" && href === "index.html")) a.classList.add("active");
    });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach(function(item){
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    if(!q || !a) return;
    q.addEventListener("click", function(){
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function(o){
        o.classList.remove("open"); o.querySelector(".faq-a").style.maxHeight = null;
      });
      if(!open){ item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  // Supabase client (lazy — only when configured)
  var sb = null;
  window.MT = {
    supabase: function(){
      if(sb) return sb;
      if(typeof supabase === "undefined") return null;
      if(!window.SUPABASE_URL || SUPABASE_URL.indexOf("YOUR_PROJECT") === 0) return null;
      sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return sb;
    },
    isConfigured: function(){
      return typeof SUPABASE_URL !== "undefined" && SUPABASE_URL.indexOf("YOUR_PROJECT") !== 0;
    },
    shuffle: function(arr){
      var a = arr.slice();
      for(var i = a.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    esc: function(s){
      return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
        return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
      });
    },
    // localStorage analytics (guest mode)
    stats: {
      get: function(){
        try{ return JSON.parse(localStorage.getItem("mymcqs_stats") || "{}"); }catch(e){ return {}; }
      },
      record: function(subject, correct, total){
        try{
          var s = this.get();
          s[subject] = s[subject] || {asked:0, correct:0};
          s[subject].asked += total; s[subject].correct += correct;
          localStorage.setItem("mymcqs_stats", JSON.stringify(s));
        }catch(e){}
      }
    }
  };

  // This site is PPSC-only: every query defaults to the PPSC question bank.
  window.MT_DEFAULT_EXAM = "ppsc";

  // Subjects (same bank as MCQs Tayyari — PPSC-tagged + shared MCQs)
  window.MT_SUBJECTS = [
    {slug:"computer-science", name:"Computer Science", icon:"💻", desc:"Fundamentals, hardware, software and IT concepts."},
    {slug:"english", name:"English", icon:"🔤", desc:"Grammar, vocabulary, synonyms, antonyms, comprehension."},
    {slug:"urdu", name:"Urdu", icon:"📖", desc:"Urdu adab, grammar and classical literature."},
    {slug:"islamiyat", name:"Islamiyat", icon:"🕌", desc:"Seerah, pillars of Islam and Islamic history."},
    {slug:"everyday-science", name:"Everyday Science", icon:"🔬", desc:"Physics, chemistry and biology basics."},
    {slug:"pak-study", name:"Pak Study", icon:"🇵🇰", desc:"History, geography and constitution of Pakistan."},
    {slug:"general-knowledge", name:"General Knowledge", icon:"🌍", desc:"World GK, capitals, organizations, personalities."},
    {slug:"current-affairs", name:"Current Affairs", icon:"📰", desc:"National and international current affairs."},
    {slug:"basic-mathematics", name:"Basic Mathematics", icon:"➗", desc:"Arithmetic, algebra and problem solving for PPSC."},
    {slug:"past-papers", name:"Past Papers", icon:"📝", desc:"Solved PPSC past papers, structured mocks."}
  ];

  // Single exam: PPSC
  window.MT_EXAMS = [
    {slug:"ppsc", name:"PPSC", full:"Punjab Public Service Commission", icon:"🎯", tag:"Most Popular", desc:"Lecturer, ASI, Patwari, Junior Clerk & all Punjab posts.", logo:"img/exams/logos/logo-ppsc.png",
     sim:{q:100,min:90,neg:0.25,pass:40},seoTitle:"PPSC Test Preparation 2026 | PPSC MCQs, Past Papers & One Paper Guide",
     seoDesc:"Free PPSC test preparation 2026 — Punjab Public Service Commission MCQs, solved past papers, one-paper pattern guide and online practice. No login required.",
     h1:"PPSC Test Preparation 2026"}
  ];
})();
