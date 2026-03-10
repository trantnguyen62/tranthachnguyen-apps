import { Question, Language } from '../types';

export const questionsEn: Question[] = [
  {
    id: 1,
    text: "It is unlawful for any person to leave the roadway and travel across private property to avoid an official traffic control device.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "Illinois law prohibits driving across private property to bypass any official traffic control device, such as a stop sign or traffic signal."
  },
  {
    id: 2,
    text: "When you come to a stop sign, you must stop your vehicle:",
    options: [
      "As close to the stop sign as possible.",
      "At a marked stop line, before entering the crosswalk, or before entering the intersection if there is no crosswalk.",
      "At a place near the intersection providing you come to a complete stop."
    ],
    correctIndex: 1,
    explanation: "Illinois law requires stopping at the marked stop line first. If there is no line, stop before the crosswalk. If there is no crosswalk, stop before entering the intersection."
  },
  {
    id: 3,
    text: "When there are flashing signals at a railroad crossing and the train clears the crossing, how soon should you proceed?",
    options: [
      "Just as soon as the train clears the crossing.",
      "After you check to make sure another train is not approaching on another track.",
      "Follow the vehicle ahead of you."
    ],
    correctIndex: 1,
    explanation: "Railroad crossings may have multiple tracks. A second train can approach immediately after the first. Always check that all tracks are clear before crossing."
  },
  {
    id: 4,
    text: "When an authorized emergency vehicle which is using its siren and flashing lights approaches your vehicle, you should:",
    options: [
      "Increase your speed.",
      "Continue at the same speed.",
      "Pull over to the right-hand edge of the highway and stop, if possible."
    ],
    correctIndex: 2,
    explanation: "Illinois law requires drivers to pull to the right edge of the road and stop to yield to emergency vehicles using sirens and flashing lights."
  },
  {
    id: 5,
    text: "When passing another vehicle, you should not cut back into the right lane until you can see the vehicle that you just passed in your rearview mirror.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "Cutting back too soon can cause a sideswipe collision. Waiting until the passed vehicle appears in your rearview mirror ensures you have enough clearance to merge safely."
  },
  {
    id: 6,
    text: "When driving along the highway and the front right wheel of your vehicle runs off the pavement, you should:",
    options: [
      "Grasp the steering wheel tightly and take your foot off the accelerator.",
      "Apply the brakes immediately and swing back onto the pavement quickly.",
      "Quickly swing back onto the pavement at your normal speed."
    ],
    correctIndex: 0,
    explanation: "Braking hard or jerking the wheel when a tire leaves the pavement can cause a rollover. Gripping the wheel and easing off the gas lets the vehicle slow naturally before you steer gently back."
  },
  {
    id: 7,
    text: "The driver and front-seat passengers (age 6 and above) are required to wear seat safety belts while riding in a motor vehicle on Illinois roadways. Violators are subject to:",
    options: [
      "A $75 fine plus court costs.",
      "Suspension of license.",
      "None of the above."
    ],
    correctIndex: 0,
    explanation: "Illinois law requires seatbelts for all drivers and front-seat passengers age 6 and older. The penalty for non-compliance is a $75 fine plus court costs."
  },
  {
    id: 8,
    text: "When a two-lane pavement is marked with a single solid yellow line on your side of the center line:",
    options: [
      "You must slow down and proceed with caution.",
      "Construction work is going on ahead, slow down.",
      "You must not cross the yellow line to pass another vehicle."
    ],
    correctIndex: 2,
    explanation: "A solid yellow line on your side of the centerline means you are in a no-passing zone. You must not cross it to pass another vehicle."
  },
  {
    id: 9,
    text: "Which of the following laws and safety rules apply to bicyclists?",
    options: [
      "Bicyclists are entitled to the same right-of-way as other vehicles.",
      "Bicyclists should travel in the opposite direction of other vehicles.",
      "The safest hours for operation are during the day."
    ],
    correctIndex: 0,
    explanation: "In Illinois, bicyclists have the same legal right-of-way privileges as motor vehicles. They must also follow the same traffic laws, including stops signs and signals."
  },
  {
    id: 10,
    text: "When a school bus is stopped on a two-lane highway and its red warning lights are flashing and its stop signal arm is extended, you must:",
    options: [
      "Slow down, sound your horn and pass the bus with caution.",
      "Pass the bus on the left if there are no vehicles approaching from the opposite direction.",
      "Stop your vehicle before reaching the bus."
    ],
    correctIndex: 2,
    explanation: "Illinois law requires all vehicles on both sides of a two-lane road to come to a complete stop before reaching a stopped school bus with red flashing lights and the stop arm extended."
  },
  {
    id: 11,
    text: "Your driving privileges will be revoked in the State of Illinois if you are convicted of:",
    options: [
      "Leaving the scene of an accident in which you are involved as a driver, if the accident results in death or personal injury.",
      "Drag racing.",
      "Driving or being in actual physical control of a vehicle while under the influence of alcohol or other drug.",
      "All of the above."
    ],
    correctIndex: 3,
    explanation: "All three offenses—hit-and-run causing injury or death, drag racing, and DUI—are grounds for mandatory license revocation in Illinois."
  },
  {
    id: 12,
    text: "When a right turn against a red signal light is allowed, the proper way to make the turn is to:",
    options: [
      "Turn quickly to get out of the way of other traffic.",
      "Stop, give the right-of-way to any persons or vehicles within the intersection, then cautiously make your turn.",
      "Stop, sound your horn to warn other traffic, then make your turn."
    ],
    correctIndex: 1,
    explanation: "Even when a right turn on red is permitted, you must come to a complete stop and yield to all pedestrians and vehicles already in or entering the intersection before turning."
  },
  {
    id: 13,
    text: "When headlights are required, they should be dimmed at least 500 feet before meeting and 300 feet before overtaking another vehicle.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "Illinois law requires switching from high beams to low beams at least 500 feet before meeting an oncoming vehicle and at least 300 feet before passing another vehicle to avoid blinding other drivers."
  },
  {
    id: 14,
    text: "If you MUST drive during foggy weather, you should turn on the low-beam headlights and:",
    options: [
      "Drive at a speed that will allow you to stop within your field of vision.",
      "Flash your lights routinely.",
      "Keep your foot on the brake pedal so your red lights will be seen more easily."
    ],
    correctIndex: 0,
    explanation: "In fog, use low beams because high beams reflect off the fog and reduce visibility. Drive slowly enough that you can stop within the distance you can see ahead."
  },
  {
    id: 15,
    text: "When approaching a railroad grade crossing which does NOT have ANY warning system (such as electric flashing lights or gates), you should:",
    options: [
      "Increase speed and cross the tracks as quickly as possible.",
      "Continue at your normal speed.",
      "Look, listen, slow down in case you have to stop, and proceed when safe to do so."
    ],
    correctIndex: 2,
    explanation: "Without automatic warnings, you must rely entirely on your own senses. Always look in both directions, listen for a train, slow down, and be prepared to stop before crossing."
  },
  {
    id: 16,
    text: "It is permissible for you to pass on the shoulder of the road.",
    options: ["True", "False"],
    correctIndex: 1,
    explanation: "Driving on the shoulder to pass other vehicles is illegal in Illinois. The shoulder is reserved for emergencies, not as a passing lane."
  },
  {
    id: 17,
    text: "You are waiting at an intersection and the traffic signal light changes to green. You may then go ahead:",
    options: [
      "Immediately.",
      "When you think it is safe to do so.",
      "After first yielding the right-of-way to any persons or vehicle which are within the intersection."
    ],
    correctIndex: 2,
    explanation: "A green light does not grant immediate right-of-way. You must first yield to any pedestrians or vehicles that are already within the intersection before you proceed."
  },
  {
    id: 18,
    text: "Your driver license will be suspended if, after being arrested for DRIVING UNDER THE INFLUENCE of alcohol and/or drugs (DUI):",
    options: [
      "You take a chemical test and register an amount of alcohol equal to or over the legal level of intoxication (0.08%).",
      "You refuse to take a chemical test.",
      "You take a chemical test and register any trace of a controlled substance or cannabis.",
      "All of the above."
    ],
    correctIndex: 3,
    explanation: "Illinois law suspends your license in all three DUI-related scenarios: testing at or above 0.08% BAC, refusing a test, or testing positive for any controlled substance or cannabis."
  },
  {
    id: 19,
    text: "Motorcycles, though smaller and lighter in weight, have the same right-of-way privileges as other vehicles. Special observance should be given to motorcyclists when they approach an intersection, a railroad crossing, bridge or when bad weather occurs.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "Motorcycles have the same legal right-of-way as other vehicles. Their smaller size makes them harder to see, so drivers must give them extra attention especially at intersections, railroad crossings, and in poor weather."
  },
  {
    id: 20,
    text: "A person who REFUSES to submit to a chemical test, or test, of his/her blood, breath or urine for the purpose of determining the level of alcohol and/or drug content:",
    options: [
      "Will receive a driver license suspension for six months.",
      "Will receive a driver license suspension for 1 month.",
      "There is no penalty."
    ],
    correctIndex: 0,
    explanation: "Under Illinois implied consent law, refusing a chemical sobriety test (blood, breath, or urine) results in an automatic 6-month driver's license suspension for a first refusal. A second or subsequent refusal within 5 years results in a 3-year suspension."
  },
  {
    id: 21,
    text: "When driving on a slippery road and the rear end of your vehicle starts to skid, you should:",
    options: [
      "Turn the front wheels in the direction of the skid.",
      "Hold the wheel firmly and steer straight ahead, braking gradually.",
      "Apply the brakes quickly."
    ],
    correctIndex: 0,
    explanation: "Steering into the skid (turning the wheel toward the direction the rear is sliding) helps align the vehicle with its direction of travel and allows the tires to regain traction."
  },
  {
    id: 22,
    text: "The '2-Second Rule' works like this: when the vehicle ahead of you passes a fixed object like a tree, etc., if you begin counting, 'one thousand one, one thousand two' then if you reach the same tree before you have finished saying 'one thousand two,' you are following too closely.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "The 2-second rule is a simple method to maintain a safe following distance at any speed. If you pass the same fixed point before finishing the two-second count, you are too close and need to back off."
  },
  {
    id: 23,
    text: "Which of the following is the single greatest factor in fatal motor vehicle accidents?",
    options: ["Alcohol", "Bad road conditions", "Bad weather conditions", "Mechanical problems"],
    correctIndex: 0,
    explanation: "Alcohol is the leading cause of fatal traffic accidents. It impairs judgment, slows reaction time, and reduces coordination and vision, dramatically increasing crash risk."
  },
  {
    id: 24,
    text: "When you are driving and one of your tires has a blow out, you should:",
    options: [
      "Apply the brake quickly to reduce speed.",
      "Grip the steering wheel firmly, take your foot off the gas pedal, and let the vehicle slow down before you drive onto the shoulder.",
      "Quickly steer onto the front shoulder."
    ],
    correctIndex: 1,
    explanation: "Braking suddenly during a blowout can cause loss of control. The safest approach is to grip the wheel firmly, ease off the gas, and allow the car to decelerate naturally before pulling safely to the shoulder."
  },
  {
    id: 25,
    text: "The road surface of a bridge may be dangerous in winter because:",
    options: [
      "There may be ice on bridges even when other pavements are clear.",
      "The bridge surface is warmer.",
      "None of the above."
    ],
    correctIndex: 0,
    explanation: "Bridges are elevated and exposed to cold air from both above and below, causing them to freeze before surrounding road surfaces. Ice can form on a bridge even when the rest of the road appears clear."
  },
  {
    id: 26,
    text: "A driver moving out of an alley, private road, or driveway within an urban area must:",
    options: [
      "Stop only if there are vehicles coming down the street.",
      "Stop before reaching the sidewalk and yield to pedestrians and vehicles before proceeding.",
      "Sound your horn and exit quickly."
    ],
    correctIndex: 1,
    explanation: "Illinois law requires drivers exiting alleys, private roads, or driveways to stop before the sidewalk and yield to all pedestrians and approaching vehicles before entering the street."
  },
  {
    id: 27,
    text: "A flashing red traffic signal light at an intersection means:",
    options: [
      "You should be careful when going through the intersection.",
      "Exactly the same thing as a stop sign.",
      "An emergency vehicle is approaching from your rear."
    ],
    correctIndex: 1,
    explanation: "A flashing red light means the same as a stop sign: you must come to a complete stop, then proceed only when it is safe to do so."
  },
  {
    id: 28,
    text: "Illinois law requires children under age 6 to be secured by a restraining system or seat belt when traveling in a motor vehicle:",
    options: [
      "Anywhere in the vehicle.",
      "In the front seat only.",
      "In the back seat only."
    ],
    correctIndex: 2,
    explanation: "Illinois law requires children under age 6 to ride secured in the back seat. Placing young children in the front seat is dangerous due to airbag deployment risk."
  },
  {
    id: 29,
    text: "When a traffic light shows both a red light and a green arrow in the direction you wish to turn, you:",
    options: [
      "Must stop and remain stopped until the red light has changed.",
      "Have the right-of-way over pedestrians in turning in the direction of the arrow.",
      "May proceed in the direction of the arrow with caution."
    ],
    correctIndex: 2,
    explanation: "A green arrow displayed alongside a red light signals a protected turn in the arrow's direction. You may proceed in that direction with caution, but must still watch for pedestrians."
  },
  {
    id: 30,
    text: "With few exceptions, a person may not drive a motor vehicle if borrowed or rented for a short period of time unless the operator holds a valid drivers license that is properly classified for that type of vehicle.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "Illinois law requires any person driving a borrowed or rented vehicle to hold a valid driver's license of the appropriate class for that vehicle type, regardless of how short the rental period is."
  },
  {
    id: 31,
    text: "Unless posted otherwise, it is permissible for drivers on a one-way street to turn left on a red light into other one-way street that moves traffic to the left.",
    options: ["True", "False"],
    correctIndex: 0,
    explanation: "In Illinois, turning left on red from a one-way street onto another one-way street (where traffic flows to the left) is legal unless a sign prohibits it—similar to a right turn on red."
  },
  {
    id: 32,
    text: "When required to stop at railroad crossings, vehicles must stop:",
    options: [
      "Within 25 feet, but not less than 15 feet from the nearest railroad crossing.",
      "Within 75 feet, but not less than 25 feet from the nearest railroad crossing.",
      "Within 50 feet, but not less than 15 feet from the nearest railroad crossing."
    ],
    correctIndex: 2,
    explanation: "Illinois law requires stopping within 50 feet but no closer than 15 feet from the nearest rail. This zone ensures you are close enough to see clearly but far enough to be safe if a train passes."
  },
  {
    id: 33,
    text: "In order to reinstate full driving privileges after a DRIVING UNDER THE INFLUENCE (DUI) revocation, a person must:",
    options: [
      "Submit to a professional assessment of alcohol and/or drug use and attend a remedial or rehabilitation program.",
      "Carry high-risk auto insurance for three years.",
      "Be approved for reinstatement by a Secretary of State Hearing Officer and pay a reinstatement fee.",
      "Wait a minimum of one year.",
      "All of the above."
    ],
    correctIndex: 4,
    explanation: "DUI license reinstatement in Illinois requires completing all steps: professional alcohol/drug assessment and rehabilitation, carrying high-risk insurance for 3 years, Secretary of State approval, and waiting at least one year."
  },
  {
    id: 34,
    text: "If your vehicle starts to skid on water (Hydroplane), you should:",
    options: [
      "Turn your wheel slightly to the right and brake gently.",
      "Turn your ignition off and coast to a stop.",
      "Take your foot off the accelerator and let your vehicle slow down."
    ],
    correctIndex: 2,
    explanation: "During hydroplaning, the tires lose contact with the road surface. Lifting your foot off the accelerator allows the vehicle to naturally slow down and the tires to regain grip without causing a spin."
  },
  {
    id: 35,
    text: "Motorcycles are entitled to use the full width of a traffic lane. Therefore, when you are driving a vehicle and want to pass a motorcycle, you should:",
    options: [
      "Cautiously pass the motorcycle, sharing the same lane.",
      "Follow the motorcycle without passing it.",
      "Do not pass the motorcycle in the same lane that it is occupying."
    ],
    correctIndex: 2,
    explanation: "A motorcycle has the legal right to the full width of its lane. Passing in the same lane as a motorcycle is illegal and extremely dangerous—always use a separate lane to pass."
  },
  {
    id: 36,
    text: "You are required by law to yield the right-of-way to any authorized vehicle engaged in construction or maintenance of a highway which is displaying oscillating, rotating or flashing lights.",
    options: [
      "True",
      "False"
    ],
    correctIndex: 0,
    explanation: "Illinois law requires all drivers to yield to authorized highway construction and maintenance vehicles displaying oscillating, rotating, or flashing warning lights."
  },
  {
    id: 37,
    text: "After consuming alcohol, time is the only effective way to remove alcohol from your body.",
    options: [
      "True",
      "False"
    ],
    correctIndex: 0,
    explanation: "No remedy speeds up alcohol metabolism. Coffee, cold showers, food, or exercise have no effect on blood alcohol content. Only time allows the body to process and eliminate alcohol."
  },
  {
    id: 38,
    text: "When making a left or right turn in a business or residential district, a continuous signal to turn must be given:",
    options: [
      "Not less than 100 feet before turning.",
      "At least 50 feet from the intersection.",
      "Only when vehicles are coming toward you."
    ],
    correctIndex: 0,
    explanation: "Illinois law requires drivers to signal continuously for at least 100 feet before turning in a business or residential district so other drivers and pedestrians have adequate warning."
  },
  {
    id: 39,
    text: "If you are convicted of passing a school bus that is receiving or discharging passengers, you may lose your drivers license for at least 30 days.",
    options: [
      "True",
      "False"
    ],
    correctIndex: 0,
    explanation: "Illegally passing a stopped school bus is a serious offense in Illinois. A conviction can result in a license suspension of at least 30 days because it directly endangers children."
  },
  {
    id: 40,
    text: "Most rear end collisions are caused by:",
    options: [
      "The vehicle in front stopping too fast.",
      "The vehicle in back following too closely.",
      "Dangerous road conditions."
    ],
    correctIndex: 1,
    explanation: "Tailgating is the primary cause of rear-end collisions. When following too closely, the driver behind does not have enough time or distance to stop before hitting the vehicle ahead."
  },
  {
    id: 41,
    text: "Signs with orange backgrounds are:",
    options: [
      "General warning signs.",
      "Construction and maintenance warning signs.",
      "Regulatory signs."
    ],
    correctIndex: 1,
    image: "/images/construction.svg",
    explanation: "Orange background signs are used exclusively in construction and maintenance work zones. They warn drivers of workers, equipment, and changed road conditions ahead."
  },
  {
    id: 42,
    text: "A yellow pennant-shaped sign on the left side of the roadway means:",
    options: [
      "Do not enter.",
      "No parking.",
      "No passing zone."
    ],
    correctIndex: 2,
    image: "/images/no_passing.svg",
    explanation: "The yellow pennant-shaped sign is always posted on the left side of the road to mark the start of a no-passing zone. Its unique shape makes it easy to identify at a glance."
  },
  {
    id: 43,
    text: "A round yellow sign with a black 'X' and 'RR' means:",
    options: [
      "Stop sign ahead.",
      "Railroad crossing ahead.",
      "Construction ahead."
    ],
    correctIndex: 1,
    image: "/images/rr_crossing.svg",
    explanation: "The round yellow sign with a black X and the letters RR is an advance warning sign alerting drivers that a railroad crossing is ahead. Reduce speed and be prepared to stop."
  },
  {
    id: 44,
    text: "A square sign with a red circle and the words 'DO NOT ENTER' means:",
    options: [
      "Do not enter.",
      "Yield the right-of-way.",
      "Reserved parking for persons with disabilities."
    ],
    correctIndex: 0,
    image: "/images/do_not_enter.svg",
    explanation: "The DO NOT ENTER sign prohibits drivers from entering that road or lane. It is commonly used on one-way roads to prevent wrong-way driving."
  },
  {
    id: 45,
    text: "A yellow diamond sign showing a straight line and a curved line joining it means:",
    options: [
      "Highway entrance ramp.",
      "Road widens.",
      "Right lane ends."
    ],
    correctIndex: 2,
    image: "/images/lane_ends.svg",
    explanation: "This yellow diamond sign warns that the right lane is ending ahead and that drivers in that lane must merge left. Prepare to yield to traffic in the continuing lane."
  },
  {
    id: 46,
    text: "A red octagonal (8-sided) sign that says 'STOP' means:",
    options: [
      "Slow down or stop.",
      "Stop if necessary.",
      "You must come to a complete stop."
    ],
    correctIndex: 2,
    image: "/images/stop.svg",
    explanation: "A STOP sign always requires a complete stop—not a slow roll. After stopping, yield to all traffic and pedestrians before proceeding. Rolling through a stop sign is illegal."
  },
  {
    id: 47,
    text: "A round yellow sign means:",
    options: [
      "Railroad ahead.",
      "No passing zone.",
      "School zone."
    ],
    correctIndex: 0,
    image: "/images/railroad_ahead.svg",
    explanation: "A round (circular) yellow sign is reserved exclusively as a railroad advance warning. The circular shape itself tells you to expect a railroad crossing ahead, even before reading it."
  },
  {
    id: 48,
    text: "A yellow diamond sign with a black cross ('+') means:",
    options: [
      "Hospital.",
      "Upcoming intersection.",
      "Railroad crossing."
    ],
    correctIndex: 1,
    image: "/images/intersection.svg",
    explanation: "A yellow diamond sign with a black cross or plus-sign shape warns that an intersection is ahead. Reduce speed and watch for cross traffic, pedestrians, and turning vehicles."
  },
  {
    id: 49,
    text: "Illinois law on the use of a handheld cell phone while driving states that:",
    options: [
      "You may use a handheld phone as long as you keep both eyes on the road.",
      "Handheld cell phone use is permitted only at speeds below 30 mph.",
      "Using a handheld electronic device while driving is illegal and subject to a fine."
    ],
    correctIndex: 2,
    explanation: "Illinois prohibits the use of handheld electronic devices while operating a motor vehicle. Drivers must use hands-free technology (such as a Bluetooth headset or a phone mount) to make calls. A first offense carries a $75 fine, and subsequent violations result in higher fines."
  },
  {
    id: 50,
    text: "Under Illinois' Scott's Law (Move Over Law), when you approach a stationary emergency, maintenance, or tow truck displaying flashing lights on the roadside, you must:",
    options: [
      "Come to a complete stop until all lights are off.",
      "Move to a non-adjacent lane if safely possible, or reduce speed to at least 20 mph below the posted limit if a lane change is not possible.",
      "Slow down to 10 mph and sound your horn as a warning."
    ],
    correctIndex: 1,
    explanation: "Illinois' Scott's Law requires drivers approaching any stationary authorized vehicle with flashing lights on the roadside to (1) move to a lane not adjacent to that vehicle if it is safe and possible to do so, or (2) if a lane change is not safely possible, reduce speed to at least 20 mph below the posted speed limit. Violating Scott's Law can result in fines, license suspension, and even felony charges if injury or death results."
  },
  {
    id: 51,
    text: "When a traffic signal turns yellow (amber), you should:",
    options: [
      "Speed up to clear the intersection before the light turns red.",
      "Stop before the intersection if you can do so safely.",
      "Maintain your current speed and proceed through the intersection."
    ],
    correctIndex: 1,
    explanation: "A yellow signal warns that the light is about to turn red. You must stop before entering the intersection if you can do so safely. Only continue through if stopping would require sudden braking that could cause a rear-end collision. Speeding up to beat a red light is dangerous and illegal."
  },
  {
    id: 52,
    text: "When two vehicles arrive at an uncontrolled intersection (no signs or signals) at the same time, who has the right-of-way?",
    options: [
      "The vehicle traveling at a higher speed.",
      "The vehicle on the left.",
      "The vehicle on the right."
    ],
    correctIndex: 2,
    explanation: "At an uncontrolled intersection where two vehicles arrive simultaneously, the driver on the left must yield to the driver on the right. This 'yield to the right' rule helps prevent collisions when no traffic control devices are present. Always slow down and be prepared to yield when approaching uncontrolled intersections."
  },
  {
    id: 53,
    text: "In Illinois, it is illegal to park within how many feet of a fire hydrant?",
    options: [
      "10 feet",
      "15 feet",
      "20 feet"
    ],
    correctIndex: 1,
    explanation: "Illinois law prohibits parking within 15 feet of a fire hydrant to ensure firefighters have unobstructed access in an emergency. Violators may be fined and their vehicle towed."
  },
  {
    id: 54,
    text: "To maintain a safe following distance under normal driving conditions, you should stay at least how many seconds behind the vehicle in front of you?",
    options: [
      "1 second",
      "2 seconds",
      "3 seconds"
    ],
    correctIndex: 2,
    explanation: "The 3-second rule is the standard for safe following distance under normal conditions. Pick a fixed object ahead; when the vehicle in front passes it, count three full seconds. If you reach the object before finishing the count, you are following too closely. Increase this gap in adverse weather or low visibility."
  },
  {
    id: 55,
    text: "When you see a yield sign, you must:",
    options: [
      "Come to a complete stop and wait for a signal.",
      "Slow down and give the right-of-way to traffic already in the intersection or roadway.",
      "Maintain your speed because you have the right-of-way."
    ],
    correctIndex: 1,
    explanation: "A yield sign means slow down and be prepared to stop if necessary. You must give the right-of-way to any vehicles or pedestrians in the intersection or approaching on the cross road. Unlike a stop sign, a full stop is not required if the way is clearly open."
  }
];

export const questionsVi: Question[] = [
  {
    id: 1,
    text: "Rời khỏi lòng đường và đi băng qua tài sản tư nhân để tránh thiết bị kiểm soát giao thông chính thức là bất hợp pháp.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Pháp luật Illinois cấm lái xe qua tài sản tư nhân để tránh bất kỳ thiết bị kiểm soát giao thông chính thức nào, chẳng hạn như biển Stop hoặc đèn tín hiệu."
  },
  {
    id: 2,
    text: "Khi bạn gặp biển báo dừng (Stop sign), bạn phải dừng xe:",
    options: [
      "Càng gần biển báo dừng càng tốt.",
      "Tại vạch dừng được đánh dấu, trước khi vào lối qua đường (crosswalk), hoặc trước khi vào giao lộ nếu không có lối qua đường.",
      "Tại một nơi gần giao lộ miễn là bạn dừng hẳn."
    ],
    correctIndex: 1,
    explanation: "Luật Illinois yêu cầu dừng tại vạch dừng được đánh dấu trước. Nếu không có vạch, dừng trước lối qua đường. Nếu không có lối qua đường, dừng trước khi vào giao lộ."
  },
  {
    id: 3,
    text: "Khi có tín hiệu đèn nhấp nháy tại đường sắt giao cắt và tàu đã đi qua, bạn nên tiếp tục đi khi nào?",
    options: [
      "Ngay sau khi tàu đi qua khỏi chỗ giao cắt.",
      "Sau khi bạn kiểm tra để chắc chắn rằng không có tàu nào khác đang đến trên đường ray khác.",
      "Đi theo xe phía trước."
    ],
    correctIndex: 1,
    explanation: "Đường sắt có thể có nhiều đường ray. Một đoàn tàu khác có thể đến ngay sau đoàn tàu đầu tiên. Luôn kiểm tra tất cả các đường ray đều thông thoáng trước khi qua."
  },
  {
    id: 4,
    text: "Khi một xe ưu tiên đang sử dụng còi và đèn nhấp nháy tiếp cận xe của bạn, bạn nên:",
    options: [
      "Tăng tốc độ.",
      "Tiếp tục giữ nguyên tốc độ.",
      "Tấp vào lề bên phải của đường và dừng lại nếu có thể."
    ],
    correctIndex: 2,
    explanation: "Luật Illinois yêu cầu tài xế phải tấp vào lề phải của đường và dừng lại để nhường đường cho xe ưu tiên đang sử dụng còi và đèn nhấp nháy."
  },
  {
    id: 5,
    text: "Khi vượt xe khác, bạn không nên quay lại làn đường bên phải cho đến khi bạn có thể nhìn thấy chiếc xe bạn vừa vượt qua trong gương chiếu hậu.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Quay lại làn quá sớm có thể gây va chạm bên sườn. Chờ cho đến khi xe vừa vượt hiện ra trong gương chiếu hậu đảm bảo bạn có đủ khoảng cách để nhập làn an toàn."
  },
  {
    id: 6,
    text: "Khi đang lái xe trên đường cao tốc và bánh trước bên phải của xe bạn trượt ra khỏi mặt đường, bạn nên:",
    options: [
      "Nắm chặt vô lăng và nhả chân ga.",
      "Đạp phanh ngay lập tức và đánh lái nhanh trở lại mặt đường.",
      "Đánh lái nhanh trở lại mặt đường ở tốc độ bình thường."
    ],
    correctIndex: 0,
    explanation: "Phanh mạnh hoặc giật vô lăng khi bánh xe rời khỏi mặt đường có thể gây lật xe. Nắm chặt vô lăng và nhả ga giúp xe chậm lại tự nhiên trước khi bạn lái nhẹ nhàng trở lại đường."
  },
  {
    id: 7,
    text: "Người lái xe và hành khách ngồi ghế trước (từ 6 tuổi trở lên) bắt buộc phải thắt dây an toàn khi đi xe cơ giới trên đường bộ Illinois. Người vi phạm sẽ bị:",
    options: [
      "Phạt $75 cộng với án phí.",
      "Đình chỉ bằng lái.",
      "Không có ý nào ở trên."
    ],
    correctIndex: 0,
    explanation: "Luật Illinois yêu cầu thắt dây an toàn cho lái xe và hành khách ngồi ghế trước từ 6 tuổi trở lên. Hình phạt cho vi phạm là $75 cộng với án phí."
  },
  {
    id: 8,
    text: "Khi mặt đường hai làn xe được đánh dấu bằng một vạch vàng liền nét ở bên phía bạn của vạch giữa đường:",
    options: [
      "Bạn phải giảm tốc độ và tiếp tục thận trọng.",
      "Có công trình đang thi công phía trước, hãy giảm tốc độ.",
      "Bạn không được vượt qua vạch vàng để vượt xe khác."
    ],
    correctIndex: 2,
    explanation: "Vạch vàng liền nét ở phía bạn của vạch giữa đường có nghĩa là bạn đang ở vùng cấm vượt. Bạn không được vượt qua vạch đó để vượt xe khác."
  },
  {
    id: 9,
    text: "Luật và quy tắc an toàn nào sau đây áp dụng cho người đi xe đạp?",
    options: [
      "Người đi xe đạp được hưởng quyền ưu tiên giống như các phương tiện khác.",
      "Người đi xe đạp nên đi ngược chiều với các phương tiện khác.",
      "Giờ an toàn nhất để hoạt động là ban ngày."
    ],
    correctIndex: 0,
    explanation: "Tại Illinois, người đi xe đạp có quyền ưu tiên đường đi hợp pháp giống như xe cơ giới. Họ cũng phải tuân theo các luật giao thông tương tự, bao gồm biển Stop và đèn tín hiệu."
  },
  {
    id: 10,
    text: "Khi xe buýt học sinh đang dừng trên đường cao tốc hai làn và đèn cảnh báo màu đỏ đang nhấp nháy cùng biển báo dừng mở ra, bạn phải:",
    options: [
      "Giảm tốc độ, bóp còi và vượt qua xe buýt một cách thận trọng.",
      "Vượt xe buýt bên trái nếu không có xe đi ngược chiều.",
      "Dừng xe trước khi đến xe buýt."
    ],
    correctIndex: 2,
    explanation: "Luật Illinois yêu cầu tất cả các phương tiện trên cả hai phía của đường hai làn phải dừng hoàn toàn trước khi đến xe buýt trường học đang dừng với đèn đỏ nhấp nháy và cần dừng mở ra."
  },
  {
    id: 11,
    text: "Quyền lái xe của bạn sẽ bị thu hồi tại Bang Illinois nếu bạn bị kết án:",
    options: [
      "Rời khỏi hiện trường tai nạn mà bạn tham gia với tư cách là người lái xe, nếu tai nạn dẫn đến tử vong hoặc thương tích cá nhân.",
      "Đua xe trái phép.",
      "Lái xe hoặc thực tế kiểm soát phương tiện trong khi chịu ảnh hưởng của rượu hoặc ma túy khác.",
      "Tất cả các ý trên."
    ],
    correctIndex: 3,
    explanation: "Cả ba tội danh đều dẫn đến thu hồi bằng lái bắt buộc tại Illinois: bỏ trốn khỏi hiện trường tai nạn gây thương tích hoặc tử vong, đua xe trái phép, và lái xe dưới ảnh hưởng của rượu/ma túy."
  },
  {
    id: 12,
    text: "Khi được phép rẽ phải lúc đèn đỏ, cách rẽ đúng là:",
    options: [
      "Rẽ nhanh để tránh đường cho các phương tiện khác.",
      "Dừng lại, nhường đường cho bất kỳ người hoặc phương tiện nào trong giao lộ, sau đó thận trọng thực hiện cú rẽ.",
      "Dừng lại, bóp còi để cảnh báo các phương tiện khác, sau đó rẽ."
    ],
    correctIndex: 1,
    explanation: "Ngay cả khi được phép rẽ phải khi đèn đỏ, bạn vẫn phải dừng hoàn toàn và nhường đường cho tất cả người đi bộ và phương tiện đang ở trong hoặc đang vào giao lộ trước khi rẽ."
  },
  {
    id: 13,
    text: "Khi cần bật đèn pha, đèn phải được chuyển sang chế độ cốt (dimmed) ít nhất 500 feet trước khi gặp xe ngược chiều và 300 feet trước khi vượt xe khác.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Luật Illinois yêu cầu chuyển từ đèn pha xa sang đèn cốt ít nhất 500 feet trước khi gặp xe ngược chiều và 300 feet trước khi vượt xe khác để tránh làm chói mắt tài xế khác."
  },
  {
    id: 14,
    text: "Nếu bạn PHẢI lái xe trong thời tiết sương mù, bạn nên bật đèn pha cốt (low-beam) và:",
    options: [
      "Lái xe ở tốc độ cho phép bạn dừng lại trong tầm nhìn của mình.",
      "Nháy đèn thường xuyên.",
      "Giữ chân trên bàn đạp phanh để đèn đỏ dễ nhìn thấy hơn."
    ],
    correctIndex: 0,
    explanation: "Trong sương mù, dùng đèn cốt vì đèn pha xa phản xạ lại sương mù và làm giảm tầm nhìn. Lái với tốc độ đủ chậm để có thể dừng trong khoảng cách bạn nhìn thấy phía trước."
  },
  {
    id: 15,
    text: "Khi đến gần đường sắt giao cắt KHÔNG có bất kỳ hệ thống cảnh báo nào (như đèn nhấp nháy hoặc cổng chắn), bạn nên:",
    options: [
      "Tăng tốc và băng qua đường ray càng nhanh càng tốt.",
      "Tiếp tục ở tốc độ bình thường.",
      "Quan sát, lắng nghe, giảm tốc độ phòng trường hợp phải dừng lại, và tiếp tục khi an toàn."
    ],
    correctIndex: 2,
    explanation: "Khi không có thiết bị cảnh báo tự động, bạn phải hoàn toàn dựa vào giác quan của mình. Luôn nhìn cả hai hướng, lắng nghe tiếng tàu, giảm tốc độ và sẵn sàng dừng lại trước khi qua."
  },
  {
    id: 16,
    text: "Được phép vượt trên lề đường.",
    options: ["Đúng", "Sai"],
    correctIndex: 1,
    explanation: "Lái xe trên lề đường để vượt các phương tiện khác là bất hợp pháp tại Illinois. Lề đường được dành cho trường hợp khẩn cấp, không phải làn vượt xe."
  },
  {
    id: 17,
    text: "Bạn đang đợi ở giao lộ và đèn tín hiệu giao thông chuyển sang màu xanh. Bạn nên đi tiếp:",
    options: [
      "Ngay lập tức.",
      "Khi bạn nghĩ rằng an toàn để làm như vậy.",
      "Sau khi nhường đường cho bất kỳ người hoặc phương tiện nào đang ở trong giao lộ."
    ],
    correctIndex: 2,
    explanation: "Đèn xanh không cho phép qua ngay lập tức. Bạn phải nhường đường cho người đi bộ hoặc phương tiện đang ở trong giao lộ trước khi tiến vào."
  },
  {
    id: 18,
    text: "Bằng lái xe của bạn sẽ bị đình chỉ nếu, sau khi bị bắt vì LÁI XE DƯỚI ẢNH HƯỞNG của rượu và/hoặc ma túy (DUI):",
    options: [
      "Bạn thực hiện xét nghiệm hóa học và ghi nhận lượng cồn bằng hoặc vượt quá mức cho phép (0.08%).",
      "Bạn từ chối thực hiện xét nghiệm hóa học.",
      "Bạn thực hiện xét nghiệm hóa học và ghi nhận bất kỳ dấu vết nào của chất bị kiểm soát hoặc cần sa.",
      "Tất cả các ý trên."
    ],
    correctIndex: 3,
    explanation: "Luật Illinois đình chỉ bằng lái trong cả ba trường hợp liên quan đến DUI: đạt nồng độ cồn từ 0.08% trở lên, từ chối xét nghiệm, hoặc có chất ma túy/cần sa trong người."
  },
  {
    id: 19,
    text: "Xe máy, mặc dù nhỏ hơn và nhẹ hơn, có quyền ưu tiên giống như các phương tiện khác. Cần chú ý đặc biệt đến người đi xe máy khi họ đến gần giao lộ, đường sắt, cầu hoặc khi thời tiết xấu.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Xe máy có quyền ưu tiên đường đi hợp pháp như các phương tiện khác. Kích thước nhỏ hơn khiến chúng khó nhìn thấy hơn, vì vậy tài xế phải chú ý đặc biệt ở giao lộ, đường sắt và khi thời tiết xấu."
  },
  {
    id: 20,
    text: "Một người TỪ CHỐI nộp mẫu xét nghiệm hóa học máu, hơi thở hoặc nước tiểu để xác định nồng độ cồn và/hoặc ma túy:",
    options: [
      "Sẽ bị đình chỉ bằng lái xe trong sáu tháng.",
      "Sẽ bị đình chỉ bằng lái xe trong 1 tháng.",
      "Không bị phạt."
    ],
    correctIndex: 0,
    explanation: "Theo luật đồng ý ngụ ý của Illinois, từ chối xét nghiệm nồng độ cồn (máu, hơi thở hoặc nước tiểu) dẫn đến đình chỉ bằng lái tự động 6 tháng cho lần đầu từ chối. Lần từ chối thứ hai trở đi trong vòng 5 năm dẫn đến đình chỉ 3 năm."
  },
  {
    id: 21,
    text: "Khi lái xe trên đường trơn trượt và đuôi xe của bạn bắt đầu trượt, bạn nên:",
    options: [
      "Quay bánh trước về hướng xe bị trượt.",
      "Giữ chặt vô lăng và lái thẳng, phanh từ từ.",
      "Đạp phanh nhanh."
    ],
    correctIndex: 0,
    explanation: "Lái vào hướng trượt (quay vô lăng về phía đuôi xe đang trượt) giúp căn chỉnh xe theo hướng di chuyển và cho phép lốp xe lấy lại độ bám đường."
  },
  {
    id: 22,
    text: "Quy tắc '2 Giây' hoạt động như sau: khi xe phía trước bạn vượt qua một vật cố định như cái cây, nếu bạn bắt đầu đếm 'một ngàn một, một ngàn hai' và bạn đến cái cây đó trước khi đếm xong, bạn đang đi quá gần.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Quy tắc 2 giây là phương pháp đơn giản để duy trì khoảng cách an toàn ở mọi tốc độ. Nếu bạn vượt qua cùng điểm cố định trước khi đếm xong 2 giây, bạn đang đi quá gần và cần lùi lại."
  },
  {
    id: 23,
    text: "Yếu tố nào sau đây là nguyên nhân lớn nhất gây ra các vụ tai nạn xe cơ giới nghiêm trọng?",
    options: ["Rượu/Bia", "Điều kiện đường xấu", "Điều kiện thời tiết xấu", "Vấn đề kỹ thuật xe"],
    correctIndex: 0,
    explanation: "Rượu bia là nguyên nhân hàng đầu gây tai nạn giao thông nghiêm trọng. Nó làm suy giảm khả năng phán đoán, thời gian phản ứng và sự phối hợp, tăng đáng kể nguy cơ tai nạn."
  },
  {
    id: 24,
    text: "Khi bạn đang lái xe và một trong các lốp xe bị nổ, bạn nên:",
    options: [
      "Đạp phanh nhanh để giảm tốc độ.",
      "Nắm chặt vô lăng, nhả chân ga và để xe chậm lại trước khi lái vào lề đường.",
      "Đánh lái nhanh vào lề trước."
    ],
    correctIndex: 1,
    explanation: "Phanh đột ngột khi nổ lốp có thể gây mất kiểm soát. Cách an toàn nhất là nắm chặt vô lăng, nhả ga và để xe giảm tốc tự nhiên trước khi kéo vào lề an toàn."
  },
  {
    id: 25,
    text: "Mặt đường trên cầu có thể nguy hiểm vào mùa đông vì:",
    options: [
      "Có thể có băng trên cầu ngay cả khi các mặt đường khác vẫn sạch.",
      "Mặt cầu ấm hơn.",
      "Không có ý nào ở trên."
    ],
    correctIndex: 0,
    explanation: "Cầu được nâng cao và tiếp xúc với không khí lạnh từ cả trên lẫn dưới, khiến chúng đóng băng trước mặt đường thông thường. Băng có thể hình thành trên cầu ngay cả khi phần còn lại của đường vẫn sạch."
  },
  {
    id: 26,
    text: "Người lái xe đi ra từ hẻm, đường tư nhân hoặc lối đi trong khu vực đô thị phải:",
    options: [
      "Chỉ dừng lại nếu có xe đi xuống phố.",
      "Dừng lại trước khi đến vỉa hè và nhường đường cho người đi bộ và xe cộ trước khi tiếp tục.",
      "Bóp còi và thoát ra nhanh chóng."
    ],
    correctIndex: 1,
    explanation: "Luật Illinois yêu cầu tài xế ra khỏi hẻm, đường tư nhân hoặc lối đi phải dừng trước vỉa hè và nhường đường cho tất cả người đi bộ và phương tiện trước khi ra đường."
  },
  {
    id: 27,
    text: "Đèn tín hiệu giao thông màu đỏ nhấp nháy tại giao lộ có nghĩa là:",
    options: [
      "Bạn nên cẩn thận khi đi qua giao lộ.",
      "Chính xác giống như biển báo Dừng (Stop).",
      "Một xe ưu tiên đang đến gần từ phía sau."
    ],
    correctIndex: 1,
    explanation: "Đèn đỏ nhấp nháy có nghĩa giống như biển Stop: bạn phải dừng hoàn toàn, sau đó chỉ đi tiếp khi an toàn."
  },
  {
    id: 28,
    text: "Luật Illinois yêu cầu trẻ em dưới 6 tuổi phải được bảo vệ bằng hệ thống ghế an toàn hoặc dây an toàn khi đi xe cơ giới:",
    options: [
      "Bất cứ đâu trong xe.",
      "Chỉ ở ghế trước.",
      "Chỉ ở ghế sau."
    ],
    correctIndex: 2,
    explanation: "Luật Illinois yêu cầu trẻ em dưới 6 tuổi phải ngồi ở ghế sau được cố định bằng hệ thống giữ trẻ. Đặt trẻ nhỏ ở ghế trước rất nguy hiểm do túi khí có thể gây hại cho chúng."
  },
  {
    id: 29,
    text: "Khi đèn giao thông hiển thị cả đèn đỏ và mũi tên xanh theo hướng bạn muốn rẽ, bạn:",
    options: [
      "Phải dừng lại và giữ nguyên cho đến khi đèn đỏ thay đổi.",
      "Có quyền ưu tiên hơn người đi bộ khi rẽ theo hướng mũi tên.",
      "Có thể tiến hành theo hướng mũi tên một cách thận trọng."
    ],
    correctIndex: 2,
    explanation: "Mũi tên xanh hiển thị cùng đèn đỏ cho phép rẽ theo hướng được bảo vệ đó. Bạn có thể tiến hành nhưng vẫn phải chú ý người đi bộ và các phương tiện khác."
  },
  {
    id: 30,
    text: "Trừ một vài ngoại lệ, một người không được lái xe cơ giới nếu mượn hoặc thuê trong thời gian ngắn trừ khi người điều khiển có bằng lái xe hợp lệ được phân loại đúng cho loại xe đó.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Luật Illinois yêu cầu bất kỳ ai lái xe mượn hoặc thuê đều phải có bằng lái hợp lệ phù hợp với loại xe đó, bất kể thời gian thuê ngắn như thế nào."
  },
  {
    id: 31,
    text: "Trừ khi có biển báo khác, người lái xe trên đường một chiều được phép rẽ trái khi đèn đỏ vào đường một chiều khác có hướng giao thông sang trái.",
    options: ["Đúng", "Sai"],
    correctIndex: 0,
    explanation: "Tại Illinois, rẽ trái khi đèn đỏ từ đường một chiều vào đường một chiều khác (di chuyển sang trái) là hợp pháp trừ khi có biển báo cấm — tương tự như rẽ phải khi đèn đỏ."
  },
  {
    id: 32,
    text: "Khi được yêu cầu dừng lại tại đường sắt giao cắt, các phương tiện phải dừng:",
    options: [
      "Trong phạm vi 25 feet, nhưng không dưới 15 feet từ đường ray gần nhất.",
      "Trong phạm vi 75 feet, nhưng không dưới 25 feet từ đường ray gần nhất.",
      "Trong phạm vi 50 feet, nhưng không dưới 15 feet từ đường ray gần nhất."
    ],
    correctIndex: 2,
    explanation: "Luật Illinois yêu cầu dừng trong vòng 50 feet nhưng không gần hơn 15 feet tính từ đường ray gần nhất. Khoảng cách này đảm bảo bạn đủ gần để nhìn rõ nhưng đủ xa để an toàn khi tàu đi qua."
  },
  {
    id: 33,
    text: "Để khôi phục hoàn toàn quyền lái xe sau khi bị thu hồi do LÁI XE DƯỚI ẢNH HƯỞNG (DUI), một người phải:",
    options: [
      "Nộp đánh giá chuyên môn về việc sử dụng rượu và/hoặc ma túy và tham gia chương trình phục hồi.",
      "Mua bảo hiểm rủi ro cao trong ba năm.",
      "Được chấp thuận khôi phục bởi Cán bộ Điều trần của Thư ký Nhà nước và nộp phí khôi phục.",
      "Chờ tối thiểu một năm.",
      "Tất cả các ý trên."
    ],
    correctIndex: 4,
    explanation: "Khôi phục bằng lái sau khi bị thu hồi vì DUI tại Illinois yêu cầu hoàn thành tất cả các bước: đánh giá rượu/ma túy và phục hồi, bảo hiểm rủi ro cao 3 năm, chấp thuận của Thư ký Nhà nước, và chờ ít nhất một năm."
  },
  {
    id: 34,
    text: "Nếu xe của bạn bắt đầu trượt trên nước (Hydroplane), bạn nên:",
    options: [
      "Xoay nhẹ bánh xe sang phải và phanh nhẹ.",
      "Tắt máy và để xe tự trôi dừng lại.",
      "Nhả chân ga và để xe chậm lại."
    ],
    correctIndex: 2,
    explanation: "Khi bị trượt nước, lốp xe mất tiếp xúc với mặt đường. Nhấc chân khỏi ga giúp xe giảm tốc tự nhiên và lốp lấy lại độ bám mà không gây quay đầu xe."
  },
  {
    id: 35,
    text: "Xe máy được quyền sử dụng toàn bộ chiều rộng của làn đường giao thông. Do đó, khi bạn lái xe và muốn vượt xe máy, bạn nên:",
    options: [
      "Thận trọng vượt qua xe máy, chia sẻ cùng làn đường.",
      "Đi theo xe máy mà không vượt qua.",
      "Không vượt xe máy trong cùng làn đường mà nó đang chiếm giữ."
    ],
    correctIndex: 2,
    explanation: "Xe máy có quyền pháp lý sử dụng toàn bộ chiều rộng làn đường. Vượt xe máy trong cùng làn là bất hợp pháp và cực kỳ nguy hiểm — luôn dùng làn khác khi vượt."
  },
  {
    id: 36,
    text: "Theo luật, bạn phải nhường đường cho bất kỳ phương tiện được ủy quyền nào đang tham gia xây dựng hoặc bảo trì đường cao tốc đang hiển thị đèn xoay hoặc đèn nhấp nháy.",
    options: [
      "Đúng",
      "Sai"
    ],
    correctIndex: 0,
    explanation: "Luật Illinois yêu cầu tất cả tài xế phải nhường đường cho các phương tiện xây dựng và bảo trì đường đang hiển thị đèn cảnh báo xoay hoặc nhấp nháy."
  },
  {
    id: 37,
    text: "Sau khi uống rượu, thời gian là cách hiệu quả duy nhất để loại bỏ cồn khỏi cơ thể bạn.",
    options: [
      "Đúng",
      "Sai"
    ],
    correctIndex: 0,
    explanation: "Không có biện pháp nào đẩy nhanh quá trình chuyển hóa rượu. Cà phê, tắm nước lạnh, thức ăn hay tập thể dục đều không có tác dụng giảm nồng độ cồn trong máu. Chỉ có thời gian mới loại bỏ được rượu."
  },
  {
    id: 38,
    text: "Khi thực hiện rẽ trái hoặc phải trong khu kinh doanh hoặc khu dân cư, tín hiệu rẽ liên tục phải được đưa ra:",
    options: [
      "Không dưới 100 feet trước khi rẽ.",
      "Ít nhất 50 feet từ giao lộ.",
      "Chỉ khi có xe đi ngược chiều."
    ],
    correctIndex: 0,
    explanation: "Luật Illinois yêu cầu bật xi-nhan liên tục ít nhất 100 feet trước khi rẽ trong khu thương mại hoặc khu dân cư để tài xế khác và người đi bộ có đủ thời gian cảnh báo."
  },
  {
    id: 39,
    text: "Nếu bạn bị kết án vượt qua xe buýt học sinh đang đón hoặc trả khách, bạn có thể bị mất bằng lái xe ít nhất 30 ngày.",
    options: [
      "Đúng",
      "Sai"
    ],
    correctIndex: 0,
    explanation: "Vượt qua xe buýt trường học đang dừng trái phép là vi phạm nghiêm trọng tại Illinois. Bị kết án có thể dẫn đến đình chỉ bằng lái ít nhất 30 ngày vì trực tiếp gây nguy hiểm cho trẻ em."
  },
  {
    id: 40,
    text: "Hầu hết các vụ va chạm từ phía sau (tông đuôi xe) là do:",
    options: [
      "Xe phía trước dừng quá nhanh.",
      "Xe phía sau đi quá gần.",
      "Điều kiện đường nguy hiểm."
    ],
    correctIndex: 1,
    explanation: "Bám đuôi xe là nguyên nhân chính gây tai nạn đuôi xe. Khi đi quá gần, tài xế phía sau không có đủ thời gian hoặc khoảng cách để dừng lại trước khi va chạm vào xe phía trước."
  },
  {
    id: 41,
    text: "Biển báo có nền màu cam là:",
    options: [
      "Biển báo cảnh báo chung.",
      "Biển báo cảnh báo khu vực xây dựng và bảo trì.",
      "Biển báo quy định."
    ],
    correctIndex: 1,
    image: "/images/construction.svg",
    explanation: "Biển báo nền cam được dùng riêng trong các khu vực thi công và bảo trì đường. Chúng cảnh báo tài xế về công nhân, thiết bị và điều kiện đường thay đổi phía trước."
  },
  {
    id: 42,
    text: "Biển báo hình cờ đuôi nheo màu vàng ở bên trái đường có nghĩa là:",
    options: [
      "Cấm vào.",
      "Cấm đậu xe.",
      "Khu vực cấm vượt."
    ],
    correctIndex: 2,
    image: "/images/no_passing.svg",
    explanation: "Biển báo hình cờ đuôi nheo màu vàng luôn được đặt ở bên trái đường để đánh dấu bắt đầu vùng cấm vượt. Hình dạng độc đáo của nó giúp dễ nhận ra ngay từ xa."
  },
  {
    id: 43,
    text: "Biển báo tròn màu vàng với chữ 'X' và 'RR' màu đen có nghĩa là:",
    options: [
      "Biển báo dừng phía trước.",
      "Đường xe lửa băng ngang phía trước.",
      "Công trường phía trước."
    ],
    correctIndex: 1,
    image: "/images/rr_crossing.svg",
    explanation: "Biển báo tròn màu vàng với chữ X và RR màu đen là biển cảnh báo trước thông báo cho tài xế rằng có đường sắt giao cắt phía trước. Giảm tốc và sẵn sàng dừng lại."
  },
  {
    id: 44,
    text: "Biển báo hình vuông có vòng tròn đỏ và chữ 'DO NOT ENTER' có nghĩa là:",
    options: [
      "Đường cấm vào.",
      "Nhường quyền ưu tiên.",
      "Chỗ đậu xe dành cho người khuyết tật."
    ],
    correctIndex: 0,
    image: "/images/do_not_enter.svg",
    explanation: "Biển DO NOT ENTER cấm tài xế vào đường hoặc làn đó. Thường được dùng trên các đường một chiều để ngăn lái xe đi ngược chiều."
  },
  {
    id: 45,
    text: "Biển báo hình thoi màu vàng hiển thị một đường thẳng và một đường cong nhập vào nhau có nghĩa là:",
    options: [
      "Lối vào đường cao tốc.",
      "Đường mở rộng.",
      "Làn đường bên phải kết thúc."
    ],
    correctIndex: 2,
    image: "/images/lane_ends.svg",
    explanation: "Biển báo hình thoi màu vàng này cảnh báo rằng làn đường bên phải sắp kết thúc và tài xế phải nhập vào làn trái. Hãy nhường đường cho giao thông đang đi trên làn tiếp tục."
  },
  {
    id: 46,
    text: "Biển báo hình bát giác (8 cạnh) màu đỏ có chữ 'STOP' có nghĩa là:",
    options: [
      "Giảm tốc độ hoặc dừng lại.",
      "Dừng lại nếu cần thiết.",
      "Bạn phải dừng lại hoàn toàn."
    ],
    correctIndex: 2,
    image: "/images/stop.svg",
    explanation: "Biển STOP luôn yêu cầu dừng hoàn toàn — không được dừng lăn. Sau khi dừng, nhường đường cho tất cả phương tiện và người đi bộ trước khi tiếp tục. Dừng lăn qua biển Stop là vi phạm pháp luật."
  },
  {
    id: 47,
    text: "Biển báo tròn màu vàng có nghĩa là:",
    options: [
      "Đường xe lửa đằng trước.",
      "Khu vực cấm vượt.",
      "Khu vực trường học."
    ],
    correctIndex: 0,
    image: "/images/railroad_ahead.svg",
    explanation: "Biển báo tròn (hình tròn) màu vàng được dành riêng để cảnh báo đường sắt. Hình dạng tròn chính nó cho biết có đường sắt giao cắt phía trước, ngay cả trước khi đọc nội dung."
  },
  {
    id: 48,
    text: "Biển báo hình thoi màu vàng với dấu cộng ('+') màu đen có nghĩa là:",
    options: [
      "Bệnh viện.",
      "Giao lộ đằng trước.",
      "Đường xe lửa băng ngang."
    ],
    correctIndex: 1,
    image: "/images/intersection.svg",
    explanation: "Biển báo hình thoi màu vàng với dấu cộng hoặc hình chữ thập màu đen cảnh báo rằng có một giao lộ phía trước. Giảm tốc và chú ý giao thông cắt ngang, người đi bộ và xe rẽ."
  },
  {
    id: 49,
    text: "Luật Illinois về việc sử dụng điện thoại cầm tay khi lái xe quy định:",
    options: [
      "Bạn có thể dùng điện thoại cầm tay miễn là mắt vẫn nhìn đường.",
      "Được phép dùng điện thoại cầm tay khi tốc độ dưới 30 mph.",
      "Sử dụng thiết bị điện tử cầm tay khi lái xe là bất hợp pháp và bị phạt tiền."
    ],
    correctIndex: 2,
    explanation: "Illinois cấm sử dụng thiết bị điện tử cầm tay khi điều khiển xe cơ giới. Tài xế phải dùng công nghệ rảnh tay (như tai nghe Bluetooth hoặc giá đỡ điện thoại) khi gọi điện. Vi phạm lần đầu bị phạt $75, các lần tiếp theo bị phạt cao hơn."
  },
  {
    id: 50,
    text: "Theo Luật Scott (Move Over Law) của Illinois, khi bạn đến gần xe khẩn cấp, bảo trì hoặc xe kéo đang đứng yên với đèn nhấp nháy bên lề đường, bạn phải:",
    options: [
      "Dừng hoàn toàn cho đến khi tất cả đèn tắt.",
      "Chuyển sang làn không kề cận nếu an toàn, hoặc giảm tốc độ ít nhất 20 mph so với giới hạn nếu không thể đổi làn.",
      "Giảm xuống 10 mph và bóp còi cảnh báo."
    ],
    correctIndex: 1,
    explanation: "Luật Scott của Illinois yêu cầu tài xế khi đến gần phương tiện có thẩm quyền đang đứng yên với đèn nhấp nháy bên lề: (1) chuyển sang làn không kề cận nếu an toàn và có thể, hoặc (2) nếu không đổi làn được, giảm tốc độ ít nhất 20 mph so với giới hạn đăng. Vi phạm Luật Scott có thể bị phạt tiền, đình chỉ bằng lái, thậm chí bị truy tố hình sự nếu gây thương tích hoặc tử vong."
  },
  {
    id: 51,
    text: "Khi đèn giao thông chuyển sang màu vàng (amber), bạn nên:",
    options: [
      "Tăng tốc để qua giao lộ trước khi đèn chuyển đỏ.",
      "Dừng lại trước giao lộ nếu có thể làm an toàn.",
      "Giữ nguyên tốc độ và tiếp tục qua giao lộ."
    ],
    correctIndex: 1,
    explanation: "Đèn vàng cảnh báo đèn sắp chuyển đỏ. Bạn phải dừng lại trước giao lộ nếu có thể làm an toàn. Chỉ tiếp tục đi nếu dừng lại sẽ phải phanh gấp có thể gây tai nạn đuôi xe. Tăng tốc để 'qua kịp' đèn đỏ là nguy hiểm và bất hợp pháp."
  },
  {
    id: 52,
    text: "Khi hai xe đến giao lộ không có biển báo hay tín hiệu giao thông cùng lúc, ai có quyền ưu tiên?",
    options: [
      "Xe đang đi với tốc độ cao hơn.",
      "Xe ở bên trái.",
      "Xe ở bên phải."
    ],
    correctIndex: 2,
    explanation: "Tại giao lộ không có thiết bị kiểm soát giao thông, khi hai xe đến cùng lúc, tài xế bên trái phải nhường đường cho tài xế bên phải. Quy tắc 'nhường bên phải' này giúp ngăn va chạm khi không có thiết bị điều tiết giao thông. Luôn giảm tốc và sẵn sàng nhường đường khi tiếp cận giao lộ không có kiểm soát."
  },
  {
    id: 53,
    text: "Tại Illinois, đỗ xe trong phạm vi bao nhiêu feet tính từ trụ cứu hỏa là bất hợp pháp?",
    options: [
      "10 feet",
      "15 feet",
      "20 feet"
    ],
    correctIndex: 1,
    explanation: "Pháp luật Illinois cấm đỗ xe trong vòng 15 feet tính từ trụ cứu hỏa để đảm bảo lính cứu hỏa có thể tiếp cận dễ dàng trong trường hợp khẩn cấp. Người vi phạm có thể bị phạt tiền và xe bị kéo đi."
  },
  {
    id: 54,
    text: "Để duy trì khoảng cách an toàn trong điều kiện lái xe bình thường, bạn nên giữ khoảng cách ít nhất bao nhiêu giây phía sau xe phía trước?",
    options: [
      "1 giây",
      "2 giây",
      "3 giây"
    ],
    correctIndex: 2,
    explanation: "Quy tắc 3 giây là tiêu chuẩn về khoảng cách theo xe an toàn trong điều kiện bình thường. Chọn một vật cố định phía trước; khi xe trước vượt qua nó, hãy đếm đủ 3 giây. Nếu bạn đến vật đó trước khi đếm xong, bạn đang đi quá gần. Tăng khoảng cách này trong điều kiện thời tiết xấu hoặc tầm nhìn kém."
  },
  {
    id: 55,
    text: "Khi bạn thấy biển nhường đường (yield sign), bạn phải:",
    options: [
      "Dừng hoàn toàn và chờ tín hiệu.",
      "Giảm tốc và nhường quyền ưu tiên cho phương tiện đã có trong giao lộ hoặc đường.",
      "Giữ nguyên tốc độ vì bạn có quyền ưu tiên."
    ],
    correctIndex: 1,
    explanation: "Biển nhường đường có nghĩa là giảm tốc và sẵn sàng dừng lại nếu cần thiết. Bạn phải nhường quyền ưu tiên cho bất kỳ phương tiện hoặc người đi bộ nào đang ở trong giao lộ hoặc đang đến từ đường ngang. Khác với biển dừng, bạn không cần dừng hoàn toàn nếu đường thông thoáng."
  }
];

// Always return questionsEn by default, but having questionsVi available for the helper
export const questions = questionsEn;

export const getQuestions = (lang: Language): Question[] => {
  return lang === 'vi' ? questionsVi : questionsEn;
};
