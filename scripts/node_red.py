import os, time, sys, datetime, time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys

date = datetime.datetime.now().strftime("%Y-%m-%d-%H%M:%S:%f")
username = "devx-skit-governance"
if "PAGERDUTY_API_TOKEN" in os.environ:
    # using a secured environment variable to avoid exposure
    password =  os.environ["PAGERDUTY_API_TOKEN"]
else:
    password = "governator"

# Do an action on the app's landing page
options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
driver = webdriver.Chrome(options=options)
driver.get(os.environ["APP_URL"]); # Open a browser to the app's landing page

is_setup_wizard = False
h3_elems = driver.find_elements_by_xpath('//h3')
for elem in h3_elems:
    if elem.text == "Welcome to your new Node-RED instance on IBM Cloud":
        is_setup_wizard = True
        break

def validate_landing_page():
    print("Checking if we've encountered the landing page")
    found_node_red_heading = False
    h1_elems = driver.find_elements_by_xpath('//h1')
    for elem in h1_elems:
        if elem.text == "Node-RED":
            found_node_red_heading = True
            break

    found_node_red_subheading = False
    h2_elems = driver.find_elements_by_xpath('//h2')
    for elem in h2_elems:
        if elem.text == "Flow-based programming for the Internet of Things":
            found_node_red_subheading = True
            break

    found_editor_link = False
    a_elems = driver.find_elements_by_xpath('//a')
    for elem in a_elems:
        if elem.text == "Go to your Node-RED flow editor":
            found_editor_link = True
            break

    if not found_node_red_heading:
        sys.exit("Experience Test Failed: could not find landing page heading")
    if not found_node_red_subheading:
        sys.exit("Experience Test Failed: could not find landing page subheading")
    if not found_editor_link:
        sys.exit("Experience Test Failed: could not find landing page editor link")

if is_setup_wizard:
    print("Encountered initial setup wizard")
    next_button = driver.find_element_by_xpath("//button[@id='btn-next']") # Locate the Next button
    next_button.click()

    # set up as secure
    secure_editor_radio_button = driver.find_element_by_xpath("//input[@id='secureOption-enabled']")
    secure_editor_radio_button.click()
    username_field = driver.find_element_by_xpath("//input[@input='secureOption-username']")
    username_field.send_keys(username)
    password_field = driver.find_element_by_xpath("//input[@input='secureOption-password']")
    password_field.send_keys(password)

    next_button.click() # go to next panel
    next_button.click() # skip learning panel

    finish_button = driver.find_element_by_xpath("//button[@id='btn-finish']")
    finish_button.click()

    time.sleep(15)
    validate_landing_page()
else:
    validate_landing_page()
