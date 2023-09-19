#!/usr/bin/expect -f

# Set environment variables
set email $env(EMAIL)
set password $env(PASSWORD)

spawn /usr/local/bin/audible-quickstart

expect "Please enter a name for your primary profile \[audible\]:"
send "audible\r"

expect "Enter a country code for the profile:"
send "us\r"

expect "Please enter a name for the auth file \[audible.json\]:"
send "audible.json\r"

expect "Do you want to encrypt the auth file? \[y/N\]:"
send "N\r"

expect "Do you want to login with external browser? \[y/N\]:"
send "N\r"

expect "Do you want to login with a pre-amazon Audible account? \[y/N\]:"
send "N\r"

expect "Please enter your amazon username:"
send "$email\r"

expect "Please enter your amazon password:"
send "$password\r"

expect "Repeat for confirmation:"
send "$password\r"

expect "Do you want to continue? \[y/N\]:"
send "y\r"

expect {
    "Open Captcha with default image viewer \[Y/n\]:" {
        send "n\r"
        expect "Please open the following url with a web browser to get the captcha:"
        expect -re "(https://.*jpg)"
        puts "Please open the following URL in your web browser and enter the CAPTCHA solution:"
        puts $expect_out(1,string)
        expect "Answer for CAPTCHA:"
        # Here you need to manually enter the CAPTCHA solution
        set captcha_solution [gets stdin]
        send "$captcha_solution\r"
    }
    exp_continue
}