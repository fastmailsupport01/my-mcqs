/* My MCQs — MCQ submission form → mcq_submissions (status='pending', reviewed before going live) */
(function(){
  "use strict";

  function el(id){ return document.getElementById(id); }

  function init(){
    var form = el("uploadForm");
    if(!form) return;

    // subject dropdown
    var sel = el("f_subject");
    (window.MT_SUBJECTS || []).forEach(function(s){
      var o = document.createElement("option");
      o.value = s.slug; o.textContent = s.name;
      sel.appendChild(o);
    });

    var msg = el("formMsg");

    function say(text, ok){
      msg.className = "form-msg " + (ok ? "ok" : "err");
      msg.textContent = text;
      msg.style.display = "block";
      window.scrollTo({top: msg.offsetTop - 80, behavior: "smooth"});
    }

    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      if(!MT.isConfigured()){ say("Submission service is not configured yet. Please try again later.", false); return; }

      var data = {
        question: el("f_question").value.trim(),
        option_a: el("f_a").value.trim(),
        option_b: el("f_b").value.trim(),
        option_c: el("f_c").value.trim(),
        option_d: el("f_d").value.trim(),
        correct_option: (form.querySelector('input[name="correct"]:checked') || {}).value || null,
        explanation: el("f_explain").value.trim(),
        subject_slug: sel.value,
        submitter_name: el("f_name").value.trim(),
        status: "pending"
      };

      if(!data.question){ say("Please write the question.", false); return; }
      if(!data.option_a || !data.option_b || !data.option_c || !data.option_d){ say("Please fill all four options (A–D).", false); return; }
      if(!data.correct_option){ say("Please mark the correct answer (A, B, C or D).", false); return; }
      if(!data.subject_slug){ say("Please choose a subject.", false); return; }

      var btn = el("submitBtn");
      btn.disabled = true; btn.textContent = "Submitting…";

      MT.supabase().from("mcq_submissions").insert([data]).then(function(res){
        btn.disabled = false; btn.textContent = "Submit MCQ";
        if(res.error){ say("Could not submit right now. Please try again later.", false); return; }
        form.reset();
        say("Thank you! Your MCQ was received and is under review. It will appear on the site after approval.", true);
      }).catch(function(){
        btn.disabled = false; btn.textContent = "Submit MCQ";
        say("Could not submit right now. Please try again later.", false);
      });
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
