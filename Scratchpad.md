# Current simulation model operation

User creates a setup with the following parameters: 

    Rooms
    Appliances in those rooms 
    An initial watchfulness value (0.0 to 1.0)
    Days to simulate (0 to No Limit)

The program then runs through each appliance, essentially generating random data
with the one caveat being that the watchfulness value affects (1) when an
appliance is triggered to be turned on by the following function: 


    if(Math.rand() > 0.95) { 
        agent.changeApplianceState(appliance)
    }

    changeApplianceState(appliance) then does the following: 

    if(Math.rand() > watchfulness) {
        appliance.turnOn()
    }

The goals are calculated by subtracting a set percentage from the current 
week's goal. 

# Proposed new model 

The goal of the project is to show the effect of having sliders show 
the consumption/goal ratio of particular rooms or appliances to a user. 

Rather than generate the entire simluation at once, the following should happen: 

(1) User provides setup
(2) Setup is loaded into Unity as JSON
*Set some limits for rows so that later on the Unity code looks good/less tinkering is required.
(3) Node backend generates the 1st week of data 
(4) Unity code receives the JSON for the 1st week of data
(5) Data for 1st week is displayed visually
*Data includes: Rooms, Appliances, Goal, Consumption, and the Slider value
Importantly, the slider values are displayed on the mirror object.
(6) 

-----
    IEnumerator getOutputData_old(string id, int week)
    {
        Destroy(GameObject.Find("rooms"));
        foreach (Transform child in textDisplay.transform)
        {
            GameObject.Destroy(child.gameObject);
        }

        string url = "http://localhost:5002/weekly/" + id + "/" + week;

        print(url);

        using (UnityWebRequest webData = UnityWebRequest.Get(url))
        {
            yield return webData.SendWebRequest();

            nextButton.SetActive(true);
            prevButton.SetActive(true);

            JSONNode jsonData = JSON.Parse(System.Text.Encoding.UTF8.GetString(webData.downloadHandler.data));

            JSONNode rooms = jsonData[1];
            GameObject parentRoomsFolder = new GameObject("rooms");

            weekNumberText.text = "Week " + week.ToString();

            for (int i = 0; i < rooms.Count; i++)
            {
                string room_id = rooms[i]["room_id"];
                print(room_id);
                //GameObject roomObject = new GameObject(room_id);
                //roomObject.transform.SetParent(parentRoomsFolder.transform);

                // Create room id text element
                GameObject copyRoomText = Instantiate(roomTextPrefab);
                copyRoomText.transform.SetParent(textDisplay.transform, false);
                copyRoomText.GetComponentInChildren<Text>().text = room_id;

                JSONNode appliances = rooms[i]["appliances"];
                for (int j = 0; j < appliances.Count; j++)
                {
                    string appliance_id = appliances[j]["appliance_id"];
                    print(appliance_id);

                    // Create appliance id text element
                    GameObject copyApplianceText = Instantiate(applianceTextPrefab);
                    copyApplianceText.transform.SetParent(textDisplay.transform, false);
                    copyApplianceText.GetComponentInChildren<Text>().text = appliance_id;
                }
            }

            table.SetActive(true);

            //GameObject ngo = new GameObject("myTextGO");
            //Text myText = ngo.AddComponent<Text>();
        }
    }