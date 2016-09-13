Instassist.controller('AppController', function($scope, $http, $window) {
    var $o = this;
    
    $o.name = "Instassist";
    $o.email = "michael.lucero@asurion.com";
    $o.showLoader = false;
    $o.showLogin = true;
    $o.showAccount = false;
    $o.showSettings = false;
    $o.settings = {};
    $o.confirm = {};

    function showModal(options) {
        $o.confirm = {
            title: options.title,
            msg: options.msg,
            noBtn: (options && options.noBtn) ? options.noBtn : "No",
            yesBtn: (options && options.yesBtn) ? options.yesBtn : "Yes",
            yesCallback: options.yesCallback,
            data: (options && options.data) ? options.data : {}
        }
        $('#confirm').modal("show");
    }

    /**
     * email followUps
     */
    $o.emails = [];

    $o.reminderOptions = [
        {key: "everyday", label: "Everyday"},
        {key: "tomorrow_dawn", label: "Tomorrow Dawn"},
        {key: "tomorrow_morning", label: "Tomorrow Morning"},
        {key: "tomorrow_afternoon", label: "Tomorrow Afternoon"},
        {key: "tomorrow_evening", label: "Tomorrow Evening"},
        {key: "monday", label: "Monday"},
        {key: "tuesday", label: "Tuesday"},
        {key: "wednesday", label: "Wednesday"},
        {key: "thursday", label: "Thursday"},
        {key: "friday", label: "Friday"},
        {key: "saturday", label: "Saturday"},
        {key: "sunday", label: "Sunday"},
        {key: "next_week", label: "Next Week"}
    ];

    $o.autoModeOptions = [
        {key: "balanced", label: "Balanced"},
        {key: "upfront", label: "Upfront"},
        {key: "lazy", label: "Lazy"}
    ];

    $o.daysOfTheWeek = [
        {key: "monday", label: "Monday"},
        {key: "tuesday", label: "Tuesday"},
        {key: "wednesday", label: "Wednesday"},
        {key: "thursday", label: "Thursday"},
        {key: "friday", label: "Friday"},
        {key: "saturday", label: "Saturday"},
        {key: "sunday", label: "Sunday"}
    ]

    /**
     * get corresponding label for dropdown options
     */
    $o.getOptionLabel = function(key, options) {
        var label;
        for (var x=0; x<options.length; x++) {
            var opts = options[x];
            if (opts.key === key) {
                label = opts.label;
                break;
            }
        }
        return label
    }

    /**
     * Get the next e-mail followup ID
     */
    $o.getNextEmailId = function() {
        var max = 0;
        for (var x=0; x<$o.emails.length; x++) {
            var email = $o.emails[x];
            if (email.id > max) {
                max = email.id;
            }
        }

        console.log("Get next e-mail ID >> " + parseInt(max+1));
        return max+1;
    }

    $o.login = function() {
        $o.emails = [];
        
        if ($o.email) {
            var url = "/settings?email=" + $o.email;

            console.log("Logging in using " + $o.email);
            
            $o.showLoader = true;
            $o.showSettings = false;

            $http.get(url)
                .then(function successCallback(response) {
                    console.log(response);
                    var data = (response && response.data && response.data.Item) ?response.data.Item : false;
                    var follow_ups = (data && data.followUps) ? data.followUps : [];
                    var settings = (data && data.settings) ? data.settings : {};
                    
                    // get email followUps
                    for (var x=0; x<follow_ups.length; x++) {
                        var follow_up = follow_ups[x];
                        if (follow_up && follow_up.id && follow_up.key && follow_up.reminder) {
                            $o.emails.push({id: follow_up.id, key: follow_up.key, reminder: follow_up.reminder});
                        }
                    }
                    console.log("email followups >> ", $o.emails);

                    // get settings
                    $o.gcmid = (data && data.gcmid) ? data.gcmid : null;
                    $o.settings = {
                        autoMode: (settings && settings.autoMode) ? settings.autoMode : false,
                        firstDayOfWeek: (settings && settings.firstDayOfWeek) ? settings.firstDayOfWeek : false,
                        priorityEmails: (settings && settings.priorityEmails) ? settings.priorityEmails : [],
                        prioritySubjects: (settings && settings.prioritySubjects) ? settings.prioritySubjects : []
                    }

                    $o.showLoader = false;
                    $o.showSettings = true;
                    $o.showLogin = false;
                    $o.showAccount = true;
                }, function errorCallback(response) {
                    $o.showLoader = false;
                    $o.showSettings = true;
                    $o.showLogin = true;
                    $o.showAccount = false;
                });
        }
    }

    $o.selectReminder = function(email, reminder_key) {
        if (email && reminder_key) {
            email.reminder = reminder_key;

            console.log("Reminder of email follow up [" + email.key + "] has been changed to '" + reminder_key + "'");
            console.log("Email follow up has been changed >> ", email);
        }
    }

    $o.selectAuto = function(auto) {
        if (auto) {
            $o.settings.autoMode = auto;
            
            console.log("Auto mode changed to " + auto);
        }
    }

    $o.selectStartWeek = function(day) {
        if (day) {
            $o.settings.firstDayOfWeek = day;

            console.log("First day of the week has changed to " + day);
        }
    }

    $o.deleteEmail = function(email, confirm) {
        var modal_options = {
            title: "Delete E-mail Follow Up",
            msg: "Are you sure you want to delete this e-mail follow up?",
            data: email,
            yesCallback: function() {
                $('#confirm').modal("hide");

                var delete_id = email.id,
                    new_emails = [];
                for (var x=0; x<$o.emails.length; x++) {
                    var id = $o.emails[x].id,
                        reminder = $o.emails[x].reminder;

                    if (id != delete_id) {
                        new_emails.push($o.emails[x]);
                    }
                }

                $o.emails = new_emails;
                console.log("E-mail follow up was deleted >> ", email);
                console.log("New set of e-mail follow ups >> ", $o.emails);
            }
        }
        showModal(modal_options);
    }

    $o.addNewEmail = function() {
        var next_id = $o.getNextEmailId();
        $o.emails.push({id: next_id, key: "", reminder: $o.reminderOptions[0].key});
        console.log("Added new row for e-mail follow ups >>> ", $o.emails);
    }

    $o.addPriority = function(ptype) {
        ptype = ptype || 'email';
        var priority = (ptype === 'email') ? $o.priority.email : $o.priority.subject;
        if (priority) {
            if (ptype === 'email') {
                $o.settings.priorityEmails.push(priority);
                $o.priority.email = '';
                console.log("New e-mail has been added to priority e-mails >>> ", priority);
            } else if (ptype === 'subject') {
                $o.settings.prioritySubjects.push(priority);
                $o.priority.subject = '';
                console.log("New subject has been added to priority subjects >>> ", priority);
            }
        }
    }

    $o.changeEmailKey = function() {
        /**
         * TODO: catch whenever you change email key
         */
    }

    $o.saveEmailChanges = function() {
        console.log("Saving e-mail changes >> ", $o.emails);
    }

    $o.saveRulesSettings = function() {
        console.log("Saving the following settings >>> ", $o.gcmid, $o.settings);
    }
});