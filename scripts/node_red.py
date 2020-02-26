import os, time, sys, datetime
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

if is_setup_wizard:
    print("Encountered initial setup wizard")
else:
    print("Encountered landing page")
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

# item_box = driver.find_element_by_xpath("//input[@placeholder='item']") # Locate the text box
# item_box.send_keys(date) # Enter some text
# item_box.send_keys(Keys.ENTER) # Press ENTER

# # Verify the action on the app's landing page
# time.sleep(3)
# output = driver.find_element_by_id('responseArea').text.splitlines()
# print("The last entry in the 'responseArea' element is: {}".format(output[-1]))
# if output[-1] == date:
#     print("Experience Test Successful")
# else:
#     sys.exit("Experience Test Failed")
