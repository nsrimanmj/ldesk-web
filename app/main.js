/*global define */
define("app/main", ["app/controller/loginPage",
        "dojo/request",
        "app/view/messageWindow"
       ],

    /** @suppress {missingRequire|suspiciousCode|checkTypes} */
    function (Login, request, messageWindow) {
        request.get("config/config.json", {
            sync: true,
            handleAs: "json",
            preventCache: true
        }).then(function (response) {
            environment = response;
        }, function (error) {
            new messageWindow({
                message: "Failed to load Login Page.Please report to LDesk Dev immediately",
                title: "Error"
            });
            return;
        });

        var loginPage = new Login();
        loginPage.buildUI();
    });
