/* My MCQs — shared logic (APK theme, multi-page). PPSC only, guest mode. */
(function(){
  "use strict";

  var App = window.App = {};

  App.el = function(id){ return document.getElementById(id); };
  App.esc = function(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  };
  App.shuffle = function(a){
    a = a.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  App.SUBJECTS = [
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

  /* ---------- Supabase ---------- */
  var _sb = null;
  App.isConfigured = function(){
    return typeof SUPABASE_URL === "string" && SUPABASE_URL.indexOf("http") === 0
        && SUPABASE_URL.indexOf("YOUR_PROJECT_URL") < 0
        && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY.length > 40;
  };
  App.supabase = function(){
    if(_sb) return _sb;
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _sb;
  };
  function ppscOnly(r){
    return r && (r.is_active !== false) && (!r.exam_body || r.exam_body === "ppsc");
  }
  // load ALL mcqs for a subject (or all subjects) in 1000-row chunks
  App.fetchAll = function(subjectSlug, done){
    if(!App.isConfigured()){ done([]); return; }
    var out = [], start = 0, size = 1000;
    (function next(){
      var q = App.supabase().from("mcqs")
        .select("id,subject_slug,question,option_a,option_b,option_c,option_d,correct_option,explanation,exam_body,is_active")
        .order("id", {ascending:true}).range(start, start + size - 1);
      if(subjectSlug) q = q.eq("subject_slug", subjectSlug);
      q.then(function(res){
        (res.data || []).forEach(function(r){ if(ppscOnly(r)) out.push(r); });
        if((res.data || []).length === size){ start += size; next(); }
        else done(out);
      }).catch(function(){ done(out); });
    })();
  };
  App.counts = function(done){
    if(!App.isConfigured()){ done({total:0, by:{}}); return; }
    App.fetchAll(null, function(data){
      var by = {}, total = data.length;
      data.forEach(function(r){ by[r.subject_slug] = (by[r.subject_slug] || 0) + 1; });
      done({total:total, by:by});
    });
  };
  App.toOptions = function(m){
    var letters = ["A","B","C","D"];
    var texts = {A:m.option_a, B:m.option_b, C:m.option_c, D:m.option_d};
    var order = App.shuffle(letters);
    return {order:order, texts:texts, answer:m.correct_option};
  };
})();
