<? 
	require_once("db.php");
	require_once("config.php");
	require_once('vendor/autoload.php');
	
	require_once('googleapi/vendor/autoload.php');
	require_once("classes/admin.php");
	require_once("classes/account.php");
	require_once("classes/api.php");
	require_once("classes/billing.php");
	require_once("classes/mail.php");
	require_once("classes/project.php");
	require_once("classes/misc.php");
	require_once("classes/content.php");

	
   error_reporting(E_ALL);


// $subfolders = glob('helpdesk/*', GLOB_ONLYDIR);

// foreach ($subfolders as $subfolder) {
//   echo str_replace('helpdesk/', '', $subfolder).'<br>';
// }

// $subfolders = glob('helpdesk/*', GLOB_ONLYDIR);

// foreach ($subfolders as $subfolder) {
//   echo $subfolder.'<br>';
// }



	
	

    session_start();
	$billing = new Billing($db);
	$project = new Project($db);
	$mail = new Mail($db);
	$account = new Account($db, $mail);
	$api = new API($api_key, $api_url);	
	$misc = new Misc($db);
	
	if( isset($_POST['action']) ) {
		$action = $_POST['action'];

		if( $action == 'register' ) {
			$username = $_POST['username'];
			
			if( $account->isUserExists($username) ) {
				$error = "User <b>$username</b> already exists";
			} else {
				$userId = $account->createAccount($username);
				$success = true;
			}
		} else if( $action == 'login' ) {
			$username = $_POST['username'];
			$password = $_POST['password'];
			

			if( $account->login($username, $password) ) {
				header('Location: /panel');
				exit(0);
			} else {
				$error = "We couldn't find such user and password combination in our database.";
			}
		} else if( $action == 'register_trial' ) {
			$username = $_POST['username'];
			
			$trial_url = isset($_POST['url']) ? trim($_POST['url']) : '';
			$trial_geo = isset($_POST['source']) ? trim($_POST['source']) : 'global';
			
			if( $trial_url != '' ) {
				if( $project->isDomainInTheDatabase($trial_url) || !$api->checkURLForDemo($trial_url) ) {
					$register_trial_error = "The URL <b>$trial_url</b> is not eligible for the free traffic, try a different URL or use paid only projects ";
				}
			}

			if( !isset($register_trial_error) || $register_trial_error=='' )
			if( $account->isUserExists($username) ) {
				$register_trial_error = "User <b>$username</b> already exists";
			} else {
				$userId = $account->createAccount($username);
				$plans = $billing->getPlans(false);
				$nano_plan_id = 0;
				foreach($plans as $plan) if( $plan['original_code']=='nano' ) $nano_plan_id = $plan['id'];

				if( $nano_plan_id != 0 )
					$billing->addTransaction(array('customer_id'=>$userId, 'plan_id'=>$nano_plan_id, 'quantity'=>1, 'source'=>"Auto", 'reference'=>'', 'description'=>'', 'amount'=>'0'));
				
				$general_settings = $misc->readSettings("general");
				if( isset($general_settings['plan_for_trials']) && $general_settings['plan_for_trials']=='nano' ) {
					if( $nano_plan_id != 0 )
						$billing->addTransaction(array('customer_id'=>$userId, 'plan_id'=>$nano_plan_id, 'quantity'=>1, 'source'=>"Auto", 'reference'=>'', 'description'=>'', 'amount'=>'0'));

					$parse = parse_url($trial_url);
					$host = isset($parse['host']) ? $parse['host'] : $trial_url;
					if( strpos($host, '.')!==FALSE ) $host = substr($host, 0, strpos($host, '.')-1);
					
					$user_id = $userId;
					$balance = $billing->getBalance();
					$project->add($host, 'nano', $trial_url, "", "realistic", $trial_geo);
				} else {
					$project->createTrial($userId, $trial_url, $trial_geo);
				}
				
				/*
					public function addTransaction($new_transaction) {
					$sql = "INSERT INTO `transactions` (user_id, plan_id, quantity, source, reference, description, amount) VALUES (?,?,?,?,?,?,?) ";
					$stmt = $this->db->prepare($sql);
					$stmt->execute(array($new_transaction['customer_id'],$new_transaction['plan_id'],$new_transaction['quantity'],$new_transaction['source'],$new_transaction['reference'],$new_transaction['description'],$new_transaction['amount']));
					*/

				//	public function add($title, $size, $url, $referrer, $behaviour, $geo) {
				$register_trial_success = true;
			}
		} else if( $action == 'resend-activation' ) {
			$username = $_POST['username'];
			
			if( !$account->isUserExists($username) ) {
				$error = "User <b>$username</b> is not in our database";
			} else {
				$userId = $account->resendActivation($username);
				$success = true;
			}
		} else if( $action == 'contact' ) {
			$name = $_POST['name'];
			$email = $_POST['email'];
			$message = $_POST['message'];
			$error = "";

			$mail_settings = $mail->readSettings();
			$admin_email = isset($mail_settings['admin_email']) ? $mail_settings['admin_email'] : "";

			if( $admin_email == '' ) $error .= "Admin Email not set<br>";
			if( $name == '' ) $error .= "Please tell us your name<br>";
			if( $email == '' ) $error .= "Please tell us your email<br>";
			if( $message == '' ) $error .= "Please tell us your message<br>";
			
			if( $error == '' ) {
				$subject = "Contact form message from ".$name;
				$body = "$name just sent you:<br>$message";

				$mail->send($admin_email, $subject, $body);
				header('Location: /#contact');
				exit(0);
			}
		}			
	}

	$request_url = parse_url($_SERVER['REQUEST_URI']);
	$request_url = $request_url['path'];

	if( startsWith($request_url, '/register') ) {
		$regions = $project->getRegions();
		$plans = $billing->getPlans(false);
		
		$title = "Join Traffic Bot - Sign Up for Powerful Website Traffic Generator Tools";
		$description = "Sign up for Traffic Bot and gain access to powerful website traffic generator tools. Boost online visibility and drive more visitors to your site with our traffic bot."; 
		$content_filename = "register.html";

	} else if( startsWith($request_url, '/blog-newsroom') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-newsroom.html";
		$title = "Traffic Bot Blog/Newsroom - Learn What's New in Traffic Bot Technology";
		$description = "Stay up-to-date on the latest in traffic bot technology and how it can improve your website's search engine rankings. Visit the Traffic Bot Blog and Newsroom for expert insights and helpful resources."; 

	} else if( startsWith($request_url, '/blog-journal') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-journal.html";
		$title = "Traffic Bot journal- Learn What's New in Traffic Bot Technology";
		$description = "Stay up-to-date on the latest in traffic bot technology and how it can improve your website's search engine rankings. Visit the Traffic Bot Blog and Newsroom for expert insights and helpful resources."; 
	
	} else if( startsWith($request_url, '/blog-journal-page-2') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-journal-page-2.html";
		$title = "Traffic Bot journal- Learn What's New in Traffic Bot Technology";
		$description = "Stay up-to-date on the latest in traffic bot technology and how it can improve your website's search engine rankings. Visit the Traffic Bot Blog and Newsroom for expert insights and helpful resources."; 

	} else if( startsWith($request_url, '/blog-traffic-bot-reviews') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-traffic-bot-reviews.html";
		$title = "40+ Traffic Bot Reviews - Best Traffic Bot Overview 2023";
		$description = "Get the latest on traffic bot technology and boost your website's search engine rankings. Visit the Traffic Bot Blog for expert insights and resources."; 

	} else if( startsWith($request_url, '/blog-traffic-bot-guides') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-traffic-bot-guides.html";
		$title = "Explore Traffic Bot Guides - Stay Updated with Traffic Bot Technology";
		$description = "Stay informed about the latest advancements in traffic bot technology and discover how it can enhance your website's search engine rankings. Visit the Traffic Bot Blog and Newsroom for expert insights and valuable resources.";
		
	
	} else if( startsWith($request_url, '/blog-traffic-bot-comparisons') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-traffic-bot-comparisons.html";
		$title = "Discover Traffic Bot Comparisons - Unveiling the Latest in Traffic Bot Technology";
		$description = "Stay updated on the cutting-edge traffic bot technology and its impact on improving your website's search engine rankings. Explore the Traffic Bot Blog and Newsroom for expert insights and valuable resources.";		

		
	} else if( startsWith($request_url, '/blog-article-comparison-serpclick-clickseo') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-serpclick-clickseo.html";
		$title = "SERPclix vs. ClickSEO - Which is the best SERP Clicker?";
		$description = "Discover the Ultimate Comparison: ClickSEO and SERPclicks - Unveiling Their Differences, Benefits, and Effectiveness";
				
	} else if( startsWith($request_url, '/blog-article-comparison-searchseo-sparktraffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-searchseo-sparktraffic.html";
		$title = "SearchSEO vs. Sparktraffic - Which is the best SERP Clicker?";
		$description = "Discover the Ultimate Comparison: SearchSEO and SERPclicks - Unveiling Their Differences, Benefits, and Effectiveness";

	} else if( startsWith($request_url, '/blog-article-comparison-searchseo-serpclix') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-searchseo-serpclix.html";
		$title = "SearchSEO vs. SERPclix - Which is the best SERP Clicker?";
		$description = "Discover the Ultimate Comparison: SearchSEO and SERPclicks - Unveiling Their Differences, Benefits, and Effectiveness";

	} else if( startsWith($request_url, '/blog-article-comparison-searchseo-babylontraffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-searchseo-babylontraffic.html";
		$title = "SearchSEO vs. Babylon Traffic - Which is the best SERP Clicker?";
		$description = "Discover the Ultimate Comparison: SearchSEO and Babylon Traffic - Unveiling Their Differences, Benefits, and Effectiveness";

	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-sparktraffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-sparktraffic.html";
		$title = "TrafficBot and Spark Traffic Comparison - Which SERP Clicks To Choose?";
		$description = "Discover the Titans: Traffic-Bot vs. Spark Traffic. Compare and find your ideal clicker to boost website traffic. Choose wisely and drive success today!";

	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-babylontraffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-babylontraffic.html";
		$title = "TrafficBot and Babylon Traffic Comparison - Which Service To Choose?";
		$description = "Discover the Comparison: Traffic-Bot vs. BabylonTraffic. Find the perfect clicker to boost your website traffic. Choose wisely and start driving success today!";

	} else if( startsWith($request_url, '/blog-article-comparison-searchseo-serpempire') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-searchseo-serpempire.html";
		$title = "SearchSEO and SERP Empire Comparison - Which Service To Choose?";
		$description = "Compare SearchSEO and SerpEmpire: Find the Best Clicker to Drive Website Traffic. Make the Right Choice for Success Today!";

	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-serpempire') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-serpempire.html";
		$title = "TrafficBot and SERP Empire Comparison - Which Service To Choose?";
		$description = "Uncover the Comparison: TrafficBot vs. SERP Empire. Choose the Ideal Tool to Drive Website Traffic. Start Your Journey to Success Today!";


	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-trafficcreator') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-trafficcreator.html";
		$title = "Traffic-Bot and Traffic-Creator Comparison - Which Service To Choose?";
		$description = "#1 SERP Clicker: Traffic-Bot vs. Traffic-Creator. Unlock the Ultimate Traffic-Boosting Tool. Improve Your CTR Today!";

	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-serpclix') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-serpclix.html";
		$title = "Traffic-Bot and Serplix Comparison - Which Service To Choose?";
		$description = "#1 SERP Clicker: Traffic-Bot vs. Serpclix. Unlock the Ultimate Traffic-Boosting Tool. Improve Your CTR Today!";


	} else if( startsWith($request_url, '/blog-article-comparison-trafficbot-searchseo') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-comparison-trafficbot-searchseo.html";
		$title = "Traffic-Bot and SearchSEO Comparison - Which Service To Choose?";
		$description = "#1 SERP Clicker: Traffic-Bot vs. SearchSEO. Unlock the Ultimate Traffic-Boosting Tool. Improve Your CTR Today!";

	} else if( startsWith($request_url, '/blog-article-tips-tricks-utm') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-tips-tricks-utm.html";
		$title = "Using UTMs to Separate Real Visitors from Bot Traffic - A Comprehensive Guide";
		$description = "Learn how to effectively use UTMs to track the performance of your marketing campaigns and separate real visitors from bot traffic. Discover the benefits of UTMs.";


	} else if( startsWith($request_url, '/blog-traffic-bot-tips') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-traffic-bot-tips.html";
		$title = "Explore Traffic Bot Tips and Tricks - Stay Updated with Traffic Bot Technology";
		$description = "Stay informed about the latest advancements in traffic bot technology and discover how it can enhance your website's search engine rankings. Visit the Traffic Bot Blog and Newsroom for expert insights and valuable resources.";

	
	} else if( startsWith($request_url, '/blog-article-sample') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-sample.html";
		$title = "Blog Article Sample";
		$description = "";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";
		
	} else if( startsWith($request_url, '/blog-article-30-best-traffic-bots') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-30-best-traffic-bots.html";
		$title = "30 Best Traffic Bots for Website in 2023 + Free Traffic Bots";
		$description = "Boost your website traffic with our list of 30 best traffic bots for 2023, including free options. Automate your traffic and drive more visitors!";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if( startsWith($request_url, '/blog-article-review-traffic-bot-2023') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-traffic-bot-2023.html";
		$title = "Review Traffic Bot - The Ultimate Best Traffic Bot 2023";
		$description = "The Ultimate Traffic Bot Review 2023 - Boost your website traffic with The Ultimate Traffic Bot and read our review for 2023.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if( startsWith($request_url, '/blog-article-review-traffic-creator-2023') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-traffic-creator-2023.html";
		$title = "Review Traffic Creator - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Traffic Creator Review 2023 - Generate traffic and improve your online presence with The Ultimate Traffic Creator, check out our review for 2023.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if( startsWith($request_url, '/blog-article-review-clickseo-2023') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-clickseo-2023.html";
		$title = "Review Clickseo - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate ClickSEO Review 2023 - Optimize your website for search engines and drive traffic with The Ultimate ClickSEO, read our review for 2023 for more details.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";
	
	} else if (startsWith($request_url, '/blog-article-review-babylontraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-babylontraffic-2023.html";
		$title = "Review Babylon Traffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Babylon Traffic Review 2023 - Get targeted traffic to your website with The Ultimate Babylon Traffic, read our review for 2023 to learn more.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-sparktraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-sparktraffic-2023.html";
		$title = "Review SparkTraffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Spark Traffic Review 2023 - Increase your website traffic and engagement with The Ultimate Spark Traffic, check out our review for 2023 for more information.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-mediamister-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-mediamister-2023.html";
		$title = "Review MediaMister - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Media Mister Review 2023 - Buy targeted traffic and boost your online visibility with The Ultimate Media Mister, read our review for 2023 to learn more.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-simpletraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-simpletraffic-2023.html";
		$title = "Review SimpleTraffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Simple Traffic Review 2023 - Drive traffic to your website effortlessly with The Ultimate Simple Traffic, check out our review for 2023 for more details.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-simpletrafficbot-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-simpletrafficbot-2023.html";
		$title = "Review SimpleTrafficBot - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Simple Traffic Bot Review 2023 - Automate your website traffic generation with The Ultimate Simple Traffic Bot, read our review for 2023 for more information.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-redsocial-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-redsocial-2023.html";
		$title = "Review RedSocial - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Red Social Review 2023 - Drive more traffic to your website through social media with The Ultimate Red Social, read our review for 2023 to learn more.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-websitetraffica-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-websitetraffica-2023.html";
		$title = "Review Websitetraffica - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Website Traffica Review 2023 - Get high-quality website traffic with The Ultimate Website Traffica, read our review for 2023 to see if it's right for you.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-nicheonlinetraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-nicheonlinetraffic-2023.html";
		$title = "Review NicheOnlineTraffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Niche Online Traffic Review 2023 - Drive targeted traffic to your niche website with The Ultimate Niche Online Traffic, read our review for 2023 for more information.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-hitleap-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-hitleap-2023.html";
		$title = "Review HitLeap - Best Traffic Exchange 2023";
		$description = "The Ultimate Rank Boost Up Review 2023 - Boost your website's search engine ranking and traffic with The Ultimate Rank Boost Up, read our review for 2023 for more details.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-rankboostup-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-rankboostup-2023.html";
		$title = "Review RankBoostUp - Best Traffic Exchange 2023";
		$description = "The Ultimate Rank Boost Up Review 2023 - Boost your website's search engine ranking and traffic with The Ultimate Rank Boost Up, read our review for 2023 for more details.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if (startsWith($request_url, '/blog-article-review-trafficape-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-trafficape-2023.html";
		$title = "Review TrafficApe - Best Traffic Exchange 2023";
		$description = "The Ultimate Traffic Ape Review 2023 - Drive more organic traffic to your website with The Ultimate Traffic Ape, check out our review for 2023 for more information.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-somiibo-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-somiibo-2023.html";
		$title = "Review TrafficApe - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Somiibo Review 2023 - Automate your social media marketing and get more traffic with The Ultimate Somiibo, read our review for 2023 to learn more.";
		$author = "Sarah Rothschild";
	
		
	} else if (startsWith($request_url, '/blog-article-review-searchseo-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-searchseo-2023.html";
		$title = "Review SearchSEO - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate SearchSEO Review 2023 - Improve your website's SEO and get more traffic with The Ultimate SearchSEO, check out our review for 2023 for more details.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-visitorboost-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-visitorboost-2023.html";
		$title = "Review Visitor Boost - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Visitor Boost Review 2023 - Boost your website's traffic and engagement with The Ultimate Visitor Boost, read our review for 2023 to see if it's right for you.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-10khits-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-10khits-2023.html";
		$title = "Review 10KHits - The Ultimate Traffic Exchange Review 2023";
		$description = "The Ultimate 10KHits Review 2023 - Boost your website's traffic and engagement with 10KHits, read our review for 2023 to see if it's right for you.";
		$author = "Sarah Rothschild";
	
	} else if (startsWith($request_url, '/blog-article-review-fiverr-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-fiverr-2023.html";
		$title = "Review Fiverr - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Fiverr Review 2023 - Find expert freelancers to help you drive more traffic to your website on The Ultimate Fiverr, read our review for 2023 for more information.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-sigmatraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-sigmatraffic-2023.html";
		$title = "Review Sigma Traffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Sigma Traffic Review 2023 - Get targeted website traffic with The Ultimate Sigma Traffic, read our review for 2023 to learn more.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-traflick-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-traflick-2023.html";
		$title = "Review Traflick - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Traflick Review 2023 - Drive more traffic to your website and increase your online visibility with The Ultimate Traflick, check out our review for 2023 for more details.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-serpclix-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-serpclix-2023.html";
		$title = "Review Serpclix - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate SerpClix Review 2023 - Improve your website's search engine ranking and get more traffic with The Ultimate SerpClix, read our review for 2023 for more information.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-sidesmedia-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-sidesmedia-2023.html";
		$title = "Review Sides Media - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Sides Media Review 2023 - Increase your website's traffic and engagement with The Ultimate Sides Media, check out our review for 2023 to learn more.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-verytraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-verytraffic-2023.html";
		$title = "Review Very Traffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate VeryTraffic Review 2023 - Get more website traffic and leads with The Ultimate VeryTraffic, read our review for 2023 for more details.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-epictrafficbot-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-epictrafficbot-2023.html";
		$title = "Review Epic Traffic Bot - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Epic Traffic Bot Review 2023 - Drive more traffic to your website with The Ultimate Epic Traffic Bot, check out our review for 2023 to learn more.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-trafficbotco-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-trafficbotco-2023.html";
		$title = "Review Traffic Bot.co - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Trafficbot.co Review 2023 - Boost your website's traffic with The Ultimate Trafficbot.co, read our review for 2023 to see if it's right for you.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-organicvisit-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-organicvisit-2023.html";
		$title = "Review Organic Visit - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Organic Visit Review 2023 - Get organic website traffic and improve your SEO with The Ultimate Organic Visit, check out our review for 2023 for more details.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-alientraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-alientraffic-2023.html";
		$title = "Review Alien Traffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Alien Traffic Review 2023 - Drive targeted traffic to your website with The Ultimate Alien Traffic, read our review for 2023 to learn more.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-epictrafficbot-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-epictrafficbot-2023.html";
		$title = "Review Epic Traffic Bot - The Ultimate Traffic Bot Review 2023";
		$description = "";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-bestwebtraffic-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-bestwebtraffic-2023.html";
		$title = "Review Best Web Traffic - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Best Web Traffic Review 2023 - Get high-quality website traffic and improve your online presence with The Ultimate Best Web Traffic, check out our review for 2023 for more information.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-generate-website-traffic-free')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-generate-website-traffic-free.html";
		$title = "55 Ways to Generate Website Traffic for Free - Boost Online Presence";
		$description = "Learn practical strategies to increase website traffic without breaking the bank. Discover 55 free methods, including SEO optimization and free website traffic.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-trafficfans-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-trafficfans-2023.html";
		$title = "Review Traffic Fans - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Traffic Fans Review 2023 - Increase your website's traffic and engagement with The Ultimate Traffic Fans, read our review for 2023 to learn more.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-trafficmasters-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-trafficmasters-2023.html";
		$title = "Review Traffic Masters - The Ultimate Traffic Bot Review 2023";
		$description = "The Ultimate Traffic Masters Review 2023 - Get more website traffic and leads with The Ultimate Traffic Masters, check out our review for 2023 to see if it's right for you.";
		$author = "Sarah Rothschild";

	} else if (startsWith($request_url, '/blog-article-review-upseo-2023')) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-review-upseo-2023.html";
		$title = "UpSEO Review: A Detailed Look at User Dashboard, Pricing, and Traffic Quality";
		$description = "Our comprehensive review of UpSEO, focusing on the User Dashboard, Pricing, Support, and Traffic Quality. Gain insights on this SEO service today!";
		$author = "Sarah Rothschild";

	
	} else if( startsWith($request_url, '/blog-article-why-using-bot-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-why-using-bot-traffic.html";
		$title = "Why Use Bot Traffic for Your Website: The Benefits Explained";
		$description = "Uncover the reasons behind why using bot traffic for your website can lead to improved search engine rankings, increased website traffic, and a better user experience. Learn why incorporating bot traffic into your online strategy is a must for success.";
		$author = 'Sarah Rothschild';
		$date = "31.01.2023";

	} else if( startsWith($request_url, '/blog-article-is-bot-traffic-bad') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-is-bot-traffic-bad.html";
		$title = "Is Bot Traffic Bad? Understanding the Impact on Your Website";
		$description = "Discover the truth behind bot traffic and learn why it's important to protect your website from bad bots. Find out how to distinguish between good and bad bots and what you can do to prevent bad bots from affecting your website's performance.";
		$author = "Sarah Rothschild";
		$date = "30.01.2023";	
	

	} else if( startsWith($request_url, '/blog-article-what-is-bot-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-what-is-bot-traffic.html";
		$title = "What is Bot Traffic? Understanding the Basics of Automated Web Traffic";
		$description = "Learn about the ins and outs of bot traffic and how it can improve your website's search engine rankings. This comprehensive guide covers everything from the basics of bot traffic to 				expert tips for optimizing your website's visibility.";
		$blogtitle = "What is Bot Traffic? Understanding the Basics of Automated Web Traffic";
		$author = "Sarah Rothschild";
		$date = "26.01.2023";

	} else if( startsWith($request_url, '/blog-article-how-bot-traffic-can-improve-your-websites-search-engine-ranking-in-2023') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-how-bot-traffic-can-improve-your-websites-search-engine-ranking-in-2023.html";
		$title = "Boost Your Website's SEO in 2023: How Bot Traffic Can Improve Search Engine Rankings";
		$description = "Discover the power of bot traffic and how it can improve your website's search engine rankings in 2023. Learn about the benefits of using traffic bots and how to use them effectively to 			boost your SEO. Get tips and tricks from the experts at traffic-bot.com.";
		$blogtitle = "How Bot Traffic Can Improve Your Websites Search Engine Ranking";
		$author = "Sarah Rothschild";
		$date = "25.01.2023";


	} else if( startsWith($request_url, '/blog-article-traffic-bot-impact-on-seo') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-traffic-bot-impact-on-seo.html";
		$title = "Discover the Impact of Traffic Bots on SEO in 2023";
		$description = "Explore the latest research on how traffic bots can improve website search engine rankings in 2023. Learn about the impact of traffic bots on SEO and how to use them effectively.";
		$blogtitle = "Does Bot Traffic Impact on SEO?";
		$author = "Sarah Rothschild";
		$date = "25.01.2023";


	} else if( startsWith($request_url, '/blog-article-10-common-mistakes') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-10-common-mistakes.html";
		$title = "Check 10 Common Mistakes to Avoid When Using a Traffic Bot";
		$description = "Avoid common mistakes when using traffic bots to generate website traffic. Optimize your website, set project settings, monitor traffic quality, diversify traffic sources, set realistic goals, track with Google Analytics, avoid ad-loading bots, and consider the location and language of your traffic.";
		$blogtitle = "10 Common Mistakes to Avoid When Using a Traffic Bot to Drive Website Traffic";
		$author = "Sarah Rothschild";
		$date = "15.02.2023";

	} else if( startsWith($request_url, '/blog-article-10-sneaky-ways-to-boost-ctr-manipulation') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-10-sneaky-ways-to-boost-ctr-manipulation.html";
		$title = "10 Sneaky Ways To Boost CTR Manipulation + Best CTR Services";
		$description = "Improve your site's visibility with our CTR Manipulation Services. Using AI, we boost your click-through rate and search engine rankings.";
		$author = "Sarah Rothschild";
		$date = "15.02.2023";

	} else if( startsWith($request_url, '/blog-article-how-to-use-social-media') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-hot-to-use-social-media.html";
		$title = "How to Use Social Media to Drive Traffic to Your Website - Traffic-Bot";
		$description = "Want to increase traffic to your website? Discover effective social media strategies to drive traffic to your website. Learn how to create engaging content, use hashtags, promote your content and monitor your results. Read more on Traffic-Bot blog.";
		$blogtitle = "How to Use Social Media to Drive Traffic to Your Website";
		$author = "Sarah Rothschild";
		$date = "16.02.2023";

			} else if( startsWith($request_url, '/blog-article-10-reasons-why-your-website-needs-a-traffic-bot-in-2023') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-10-reasons-why-your-website-needs-a-traffic-bot-in-2023.html";
		$title = "10 Reasons Why Your Website Needs a Traffic Bot in 2023";
		$description = "Join us as we explore the top 10 reasons why your website needs a traffic bot in 2023. Get ready to feel like a mad scientist controlling an army of website visitors.";
		$blogtitle = "10 Reasons Why Your Website Needs A Traffic Bot In 2023";
		$author = "Sarah Rothschild";
		$date = "20.02.2023";

	} else if( startsWith($request_url, '/blog-article-is-bot-traffic-the-secret-to-beating-your-competition') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-is-bot-traffic-the-secret-to-beating-your-competition.html";
		$title = "Crush Your Competition with This Secret SEO Weapon: Traffic Bots!";
		$description = "Ready to take on your rivals and dominate search rankings? Discover how traffic bots can give you the edge you need to skyrocket your website traffic and crush the competition!";
		$blogtitle = "10 Reasons Why Your Website Needs A Traffic Bot In 2023";
		$author = "Sarah Rothschild";
		$date = "21.02.2023";

	} else if( startsWith($request_url, '/blog-article-traffic-bot-vs-paid-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-traffic-bot-vs-paid-traffic.html";
		$title = "Traffic Bot vs. Paid Traffic: Which One is Better for Your Website?";
		$description = "Trying to increase your website traffic? Learn the differences between using a traffic bot and paid traffic, and which one is better for your website.";
		$blogtitle = "Traffic Bot vs. Paid Traffic: Which One is Better for Your Website?";
		$author = "Sarah Rothschild";
		$date = "24.02.2023";

	} else if( startsWith($request_url, '/blog-article-how-to-avoid-penalties') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-how-to-avoid-penalties.html";
		$title = "Avoid Getting Penalized by Google: Tips for Using Traffic Bots Safely";
		$description = " Learn how to use traffic bots safely without violating Google's policies and risking penalties. Follow these tips to choose a reliable traffic bot, use it in moderation, and avoid generating clicks on ads.";
		$blogtitle = "How to Avoid Getting Penalized by Google While Using a Traffic Bot";
		$author = "Sarah Rothschild";
		$date = "03.03.2023";

	} else if( startsWith($request_url, '/blog-article-generating-quality-traffic-with-website-traffic-generator') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-generating-quality-traffic-with-website-traffic-generator.html";
		$title = "Boost Your Website Traffic with Traffic Generators: Pros, Cons, and Tips";
		$description = "Learn about website traffic generators and their advantages and disadvantages, including bot-based, network-based, and software-based generators. Discover tips for generating quality traffic and how to choose a traffic generator that aligns with your goals and needs.";
		$blogtitle = "Generating Quality Traffic with a Website Traffic Generator";
		$author = "Sarah Rothschild";
		$date = "04.03.2023";

	} else if( startsWith($request_url, '/blog-article-enhance-your-website-performance') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-enhance-your-website-performance.html";
		$title = "How to Improve Your Statistics with Traffic Bot.com";
		$description = "In this article, we'll show you how to improve your website statistics by combining the power of Google Analytics and a Traffic Bot. We'll walk you through the process of installing and setting up Google Analytics, as well as how to use a traffic bot to generate targeted traffic to your website.";
		$blogtitle = "Enhance Your Website's Performance with Google Analytics and a Traffic Bot";
		$author = "Sarah Rothschild";
		$date = "05.03.2023";

	} else if( startsWith($request_url, '/blog-article-free-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-free-traffic-bot.html";
		$title = "Free Traffic Bot: Boost Your Website's SEO.";
		$description = "Discover how to increase your website traffic with free traffic bots in 2023. Learn the best strategies for boosting your SEO ranking and user engagement with this ultimate guide.";
		$blogtitle = "Free Traffic Bot: Boost Your Website's SEO Ranking and Improve User Engagement (2023 Guide)";
		$author = "Sarah Rothschild";
		$date = "11.03.2023";

	} else if( startsWith($request_url, '/blog-article-learn-about-bot-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-learn-about-bot-traffic.html";
		$title = "Learn About Bot Traffic Today - Traffic-Bot.com";
		$description = "Discover how Traffic-Bot.com's advanced traffic bot services can help improve your website's performance and search engine rankings.";
		$blogtitle = "Learn About Bot Traffic with Traffic-Bot.com: Boost Your Website's Performance Today";
		$author = "Sarah Rothschild";
		$date = "23.03.2023";

	} else if( startsWith($request_url, '/blog-article-smm-panels') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-smm-panels.html";
		$title = "Bot Traffic vs. SMM Panels: Boosting Website Traffic & Social Media Presence";
		$description = "Compare bot traffic and SMM panels for website growth, learn their benefits for social media, and optimize your site for search engines.";
		$blogtitle = "Bot Traffic vs. SMM Panels: Which One Is Better for Website Traffic Generation?";
		$author = "Sarah Rothschild";
		$date = "03.04.2023";

	} else if( startsWith($request_url, '/blog-article-best-free-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-best-free-traffic-bot.html";
		$title = "Best Free Traffic Bot: Comparing Top Services for Your Site";
		$description = "Discover the best free traffic bot for your website. Compare Traffic-Bot.com, SparkTraffic, and Babylon Traffic on features, pricing, and traffic quality.";
		$blogtitle = "Best Free Traffic Bot: Comparison of Traffic-Bot.com, SparkTraffic.com, and BabylonTraffic.com";
		$author = "Sarah Rothschild";
		$date = "10.04.2023";

	} else if( startsWith($request_url, '/blog-article-what-is-seo-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "blog-article-what-is-seo-traffic.html";
		$title = "Mastering SEO Traffic: Boost Visibility & Convert Visitors";
		$description = "Discover the power of SEO traffic. Learn strategies, monitor progress, interpret data, and optimize your website for ultimate online success.";
		$blogtitle = "What is SEO traffic?";
		$author = "Sarah Rothschild";
		$date = "14.05.2023";

		
	} else if( startsWith($request_url, '/traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "traffic-bot.html";
		$title = "Traffic Bot - Drive Targeted Visitors to Your Site with Traffic-Bot.com";
		$description = "Boost your website's traffic with Traffic-Bot.com, a powerful traffic bot that generates high-quality visitors. Increase visibility, enhance conversions, and succeed online. Try Traffic-Bot.com today!";
		

	} else if( startsWith($request_url, '/naver') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "naver.html";
		$title = "Naver Traffic - Get More Visitors Today!";
		$description = "Boost your Naver website traffic with Traffic-Bot.com. Drive high-quality traffic and watch your rankings soar. Try it now and see the results today!";


	} else if( startsWith($request_url, '/traffic-bot-automated') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "traffic-bot-automated.html";
		$title = "Automated Traffic Bot - Drive Traffic to Your Website";
		$description = "Get high-quality targeted traffic with our automated traffic bot. Drive traffic from social media and search engines and other sources. Try it today!";

	} else if( startsWith($request_url, '/best-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "best-traffic-bot.html";
		$title = "Best Traffic Bot: Boost Your Website Traffic";
		$description = "Generate high-quality traffic from various sources and watch your website traffic go to the sky. Try Traffic-Bot.com's best traffic bot today!";



	} else if( startsWith($request_url, '/traffic-bot-software') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "traffic-bot-software.html";
		$title = "Traffic Bot Software - Boost Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot software. Try it now!";
	} 

	else if( startsWith($request_url, '/blog-article-buy-seo-traffic') ) {
	$plans = $billing->getPlans(false);
	
	$content_filename = "blog-article-buy-seo-traffic.html";
	$title = "Buy SEO Traffic - Boost Your Website's Visibility and Reach";
	$description = "Drive targeted traffic to your website with our SEO services. Increase your online presence and attract more potential customers!";
} 

else if( startsWith($request_url, '/blog-article-ctr-manipulation') ) {
	$plans = $billing->getPlans(false);
	
	$content_filename = "blog-article-ctr-manipulation.html";
	$title = "Mastering CTR Manipulation: A Comprehensive Guide For 2023";
	$description = "Unravel the intricacies of CTR Manipulation with our comprehensive guide. Enhance your SEO strategy, boost your site’s visibility, and improve your user engagement.";
} 



	// Landingpage Template

	else if( startsWith($request_url, '/landing-software') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "landing-software.html";
		$title = "Traffic Bot Software - Boost Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot software. Try it now!";
		$headingh1 = "The #1 Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is engineered to revolutionize your business SEO, skyrocketing your rankings to the top!";
		$featuresOneHeading = "Smart Dashboards";
		$featuresOneText = "We've made managing your traffic projects easier than ever with our user-friendly dashboard.";
		$featuresTwoHeading = "Project Settings";
		$featuresTwoText = "Create & adjust your traffic bot projects. Change any possible traffic parameter according to your needs.";
		$featuresThreeHeading = "24/7 Support";
		$featuresThreeText = "We will help you with any question or project. Don't hesitate to contact our support through email or chat.";
		$featuresFourHeading = "Unlimited Bot Traffic Generator";
		$featuresFourText = "Generate unlimited bot traffic with our software from over 195+ locations worldwide!";
		$testimonial = "Traffic Bot has revolutionized my website's performance! It boosted my visitor numbers and skyrocketed my online presence.";
		$signupHeading = "Start With The #1 Bot Traffic Generator";


	}
	
	// End Landingpage Template

	else if( startsWith($request_url, '/bot-traffic-generator') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "bot-traffic-generator.html";
		$title = "#1 Traffic Bot Generator - Boost Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot generator. Try it now!";
		$headingh1 = "The #1 Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is engineered to revolutionize your business SEO, skyrocketing your rankings to the top!";
		$featuresOneHeading = "Smart Dashboards";
		$featuresOneText = "We've made managing your traffic projects easier than ever with our user-friendly dashboard.";
		$featuresTwoHeading = "Project Settings";
		$featuresTwoText = "Create & adjust your traffic bot projects. Change any possible traffic parameter according to your needs.";
		$featuresThreeHeading = "24/7 Support";
		$featuresThreeText = "We will help you with any question or project. Don't hesitate to contact our support through email or chat.";
		$featuresFourHeading = "Unlimited Bot Traffic Generator";
		$featuresFourText = "Generate unlimited bot traffic with our software from over 195+ locations worldwide!";
		$testimonial = "The ease of use and quick results from Traffic Bot left me stunned. My site's traffic has never been higher!";
		$signupHeading = "Start With The #1 Bot Traffic Generator";

		
	} else if( startsWith($request_url, '/bot-traffic-generator') ) {
			$plans = $billing->getPlans(false);
			
			$content_filename = "bot-traffic-generator.html";
			$title = "#1Traffic Bot Generator - Supercharge Your Website Traffic";
			$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot software. Try it now!";
			$headingh1 = "The Ultimate Traffic Bot Generator";
			$subheadingh1 = "Traffic Bot is designed to transform your business SEO, propelling your rankings to new heights!";
			$featuresOneHeading = "Intuitive Dashboards";
			$featuresOneText = "We've made managing your traffic projects a breeze with our user-friendly dashboard.";
			$featuresTwoHeading = "Flexible Project Settings";
			$featuresTwoText = "Create and customize your traffic bot projects. Adjust any traffic parameter to suit your requirements.";
			$featuresThreeHeading = "24/7 Customer Support";
			$featuresThreeText = "Our team is here to assist with any question or project. Don't hesitate to contact our support via email or chat.";
			$featuresFourHeading = "Limitless Bot Traffic Generation";
			$featuresFourText = "Generate an unlimited amount of bot traffic with our software from over 195 locations worldwide!";
			$testimonial = "Thanks to Traffic Bot, my website traffic increased dramatically. I saw results in just a few days, and I couldn't be happier.";
			$signupHeading = "Begin with the Top Bot Traffic Generator";
	

		
	} else if( startsWith($request_url, '/free-website-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "free-website-traffic-bot.html";
		$title = "Best Traffic Bot 2023 - Free Website Traffic Bot Generator";
		$description = "Discover the best traffic bot of 2023! Generate free website traffic with our advanced traffic bot generator. Increase your online visibility, boost conversions, and take your website to new heights. Get started today with the ultimate traffic bot solution.";
		$headingh1 = "Free Website Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is crafted to revolutionize your business SEO, propelling your rankings to the top!";
		$featuresOneHeading = "Intelligent Dashboards";
		$featuresOneText = "Managing your traffic projects has never been easier with our user-friendly dashboard.";
		$featuresTwoHeading = "Customizable Project Settings";
		$featuresTwoText = "Create and fine-tune your traffic bot projects. Modify any traffic parameter to suit your needs.";
		$featuresThreeHeading = "Round-the-Clock Support";
		$featuresThreeText = "Our team is here to assist with any question or project. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Infinite Bot Traffic Generation";
		$featuresFourText = "Generate boundless bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "Incredible! Traffic Bot not only increased my site visitors but also helped me identify and target my audience more effectively.";
		$signupHeading = "Begin with the Top-rated Free Website Bot Traffic Generator";

		
	} else if( startsWith($request_url, '/free-bot-traffic-generator') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "free-bot-traffic-generator.html";
		$title = "Free Traffic Bot Generator - Amplify Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot software. Try it now!";
		$headingh1 = "#1 Free Bot Traffic Generator";
		$subheadingh1 = "Traffic Bot is designed to transform your business SEO, propelling your rankings to the top!";
		$featuresOneHeading = "Intuitive Dashboards";
		$featuresOneText = "Effortlessly manage your traffic projects with our user-friendly dashboard.";
		$featuresTwoHeading = "Flexible Project Settings";
		$featuresTwoText = "Create and customize your traffic bot projects. Adjust any traffic parameter to fit your needs.";
		$featuresThreeHeading = "24/7 Customer Support";
		$featuresThreeText = "Our team is available to help with any question or project. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Limitless Bot Traffic Generation";
		$featuresFourText = "Generate endless bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "Using Traffic Bot, I saw a significant rise in organic traffic and engagement. A game-changer for my online business!";
		$signupHeading = "Get Started with the #1 Free Bot Traffic Generator";

		
	} else if( startsWith($request_url, '/website-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "website-traffic-bot.html";
		$title = "Website Traffic Bot - Elevate Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated website traffic bot software. Try it now!";
		$headingh1 = "#1 Website Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is engineered to revolutionize your business SEO, skyrocketing your rankings to the top!";
		$featuresOneHeading = "Intelligent Dashboards";
		$featuresOneText = "Managing your traffic projects is a breeze with our user-friendly dashboard.";
		$featuresTwoHeading = "Customizable Project Settings";
		$featuresTwoText = "Create and fine-tune your traffic bot projects. Modify any traffic parameter to suit your requirements.";
		$featuresThreeHeading = "Round-the-Clock Support";
		$featuresThreeText = "Our team is here to help with any question or project. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Boundless Bot Traffic Generation";
		$featuresFourText = "Generate infinite bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "I was skeptical at first, but Traffic Bot proved me wrong. It's the ultimate solution to driving more traffic to my website.";
		$signupHeading = "Begin with the Top Website Traffic Bot Generator";

		
	} else if( startsWith($request_url, '/free-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "free-traffic-bot.html";
		$title = "Free Traffic Bot -  Boost Your Website Traffic Now!";
		$description = "Streamline your traffic generation process and enhance your website traffic with Traffic-Bot.com's top-rated free traffic bot software. Try it now!";
		$headingh1 = "The Leading Free Traffic Bot Generator";
		$subheadingh1 = "Our Free Traffic Bot is designed to revolutionize your business SEO, skyrocketing your rankings to the top!";
		$featuresOneHeading = "Intuitive Dashboards";
		$featuresOneText = "Managing your traffic projects has never been easier with our user-friendly dashboard.";
		$featuresTwoHeading = "Flexible Project Settings";
		$featuresTwoText = "Create and modify your traffic bot projects. Adjust any traffic parameter to suit your needs.";
		$featuresThreeHeading = "24/7 Customer Support";
		$featuresThreeText = "Our team is here to help you with any question or project. Don't hesitate to contact our support via email or chat.";
		$featuresFourHeading = "Infinite Free Bot Traffic Generation";
		$featuresFourText = "Generate unlimited bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "The Free Traffic Bot is a must-have tool for any online entrepreneur! My website's conversion rates and sales have skyrocketed.";
		$signupHeading = "Begin with the Top Free Traffic Bot Generator";

	} else if( startsWith($request_url, '/automated-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "automated-traffic-bot.html";
		$title = "Automated Traffic Bot - Elevate Your Website Traffic";
		$description = "Simplify your traffic generation process and enhance your website traffic with Traffic-Bot.com's highly-rated automated traffic bot software. Try it now!";
		$headingh1 = "The #1 Automated Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is designed to transform your business SEO, propelling your rankings to the top!";
		$featuresOneHeading = "Intelligent Dashboards";
		$featuresOneText = "Effortlessly manage your traffic projects with our user-friendly dashboard.";
		$featuresTwoHeading = "Customizable Project Settings";
		$featuresTwoText = "Develop and modify your traffic bot projects. Adjust any traffic parameter to fit your requirements.";
		$featuresThreeHeading = "Round-the-Clock Support";
		$featuresThreeText = "Our team is here to assist you with any question or project. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Limitless Bot Traffic Generation";
		$featuresFourText = "Produce endless bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "The customer support for Traffic Bot is exceptional. They guided me every step of the way, ensuring my success.";
		$signupHeading = "Begin with the Top Automated Traffic Bot";

	} else if( startsWith($request_url, '/buy-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "buy-traffic.html";
		$title = "Purchase Traffic - Enhance Your Website Visitor Count";
		$description = "Streamline your traffic growth efforts and amplify your website traffic with Buy-Traffic.com's top-rated traffic bot software. Experience it today!";
		$headingh1 = "The Ultimate Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is devised to transform your business SEO, sending your rankings to unparalleled heights!";
		$featuresOneHeading = "Intuitive Dashboards";
		$featuresOneText = "Our user-friendly dashboard streamlines the management of your traffic projects.";
		$featuresTwoHeading = "Flexible Project Settings";
		$featuresTwoText = "Construct and refine your traffic bot projects, adjusting every traffic parameter to suit your objectives.";
		$featuresThreeHeading = "Always-On Support";
		$featuresThreeText = "Our team is here to help with any questions or projects. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Infinite Bot Traffic Generation";
		$featuresFourText = "Produce unlimited bot traffic with our software from more than 195 locations worldwide!";
		$testimonial = "Traffic Bot's accessible interface makes it simple for even a beginner to see results. My website's traffic has never been better.";
		$signupHeading = "Begin with the Leading Traffic Bot Generator";

	} else if( startsWith($request_url, '/buy-bulk-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "buy-bulk-traffic.html";
		$title = "Bulk Traffic Bot Software - Boost Your Website Traffic";
		$description = "Automate your traffic generation efforts and boost your website traffic with Traffic-Bot.com's top-rated traffic bot software. Try it now!";
		$headingh1 = "The #1 Bulk Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is engineered to revolutionize your business SEO, skyrocketing your rankings to the top!";
		$featuresOneHeading = "Smart Dashboards";
		$featuresOneText = "We've made managing your traffic projects easier than ever with our user-friendly dashboard.";
		$featuresTwoHeading = "Project Settings";
		$featuresTwoText = "Create & adjust your traffic bot projects. Change any possible traffic parameter according to your needs.";
		$featuresThreeHeading = "24/7 Support";
		$featuresThreeText = "We will help you with any question or project. Don't hesitate to contact our support through email or chat.";
		$featuresFourHeading = "Unlimited Bot Traffic Generator";
		$featuresFourText = "Generate unlimited bot traffic with our software from over 195 location worldwide!";
		$testimonial = "I'm amazed at how Traffic Bot increased my site's visibility and ranking in search results. Highly recommended for anyone wanting more traffic!";
		$signupHeading = "Start With The #1 Bot Traffic Generator";

	} else if( startsWith($request_url, '/buy-website-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "buy-website-traffic.html";
		$title = "Buy Website Traffic - Elevate Your Site's Visitor Count";
		$description = "Automate your traffic growth strategy and increase your website traffic with Buy-Website-Traffic.com's top-rated traffic bot software. Experience it now!";
		$headingh1 = "The Premier Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot is designed to transform your business's SEO, sending your rankings soaring to new heights!";
		$featuresOneHeading = "User-Friendly Dashboards";
		$featuresOneText = "Managing your traffic projects has never been simpler with our intuitive dashboard.";
		$featuresTwoHeading = "Adaptable Project Settings";
		$featuresTwoText = "Construct and customize your traffic bot projects, modifying every traffic aspect to suit your objectives.";
		$featuresThreeHeading = "Constant Support";
		$featuresThreeText = "Our team is here to help with any questions or projects. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Limitless Bot Traffic Generation";
		$featuresFourText = "Produce unlimited bot traffic with our software from more than 195 locations worldwide!";
		$testimonial = "I've tried other traffic-enhancing tools, but none compare to Traffic Bot. It's efficient, effective, and cost-effective!";
		$signupHeading = "Begin with the Top Traffic Bot Generator";

	} else if( startsWith($request_url, '/free-bot-traffic') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "free-bot-traffic.html";
		$title = "#1 Free Traffic Bot Software - Boost Your Site's Visitor Numbers";
		$description = "Streamline your traffic growth efforts and boost your website traffic with Free-Bot-Traffic.com's top-rated traffic bot software. Try it today!";
		$headingh1 = "The Leading Free Traffic Bot Generator";
		$subheadingh1 = "Free Traffic Bot is crafted to revolutionize your business's SEO, propelling your rankings to unparalleled levels!";
		$featuresOneHeading = "Intelligent Dashboards";
		$featuresOneText = "Our user-friendly dashboard makes managing your traffic projects a breeze.";
		$featuresTwoHeading = "Customizable Project Settings";
		$featuresTwoText = "Develop and modify your traffic bot projects, tailoring every traffic parameter to meet your goals.";
		$featuresThreeHeading = "Round-the-Clock Support";
		$featuresThreeText = "Our team is prepared to assist with any inquiry or project. Contact our support through email or chat without hesitation.";
		$featuresFourHeading = "Endless Bot Traffic Generation";
		$featuresFourText = "Produce unlimited bot traffic with our software from over 195 locations across the globe!";
		$testimonial = "My site's bounce rate dropped, and average session duration rose, all thanks to Free Traffic Bot's accurate targeting.";
		$signupHeading = "Get Started with the #1 Free Bot Traffic Generator";
		

	} else if( startsWith($request_url, '/traffic-bot-free') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "traffic-bot-free.html";
		$title = "#1 Free Traffic Bot Software - Enhance Your Website's Traffic";
		$description = "Automate your traffic growth strategy and elevate your website traffic with Traffic-Bot.com's top-rated traffic bot software. Experience it now!";
		$headingh1 = "The Premier Free Traffic Bot Generator";
		$subheadingh1 = "Free Traffic Bot is designed to transform your business's SEO, sending your rankings soaring to new heights!";
		$featuresOneHeading = "User-Friendly Dashboards";
		$featuresOneText = "Managing your traffic projects has never been simpler with our intuitive dashboard.";
		$featuresTwoHeading = "Adaptable Settings";
		$featuresTwoText = "Construct and customize your traffic bot projects, modifying every traffic aspect to suit your objectives.";
		$featuresThreeHeading = "Constant Support";
		$featuresThreeText = "Our team is here to help with any questions or projects. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Limitless Bot Traffic Generation";
		$featuresFourText = "Produce unlimited bot traffic with our software from more than 195 locations worldwide!";
		$testimonial = "Free Traffic Bot's in-depth analytics enabled me to optimize my content and engage a broader, more captivated audience.";
		$signupHeading = "Begin with the Top Free Bot Traffic Generator";

	} else if( startsWith($request_url, '/traffic-bot-generator') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "traffic-bot-generator.html";
		$title = "#1 Traffic Bot Generator - Boost Your Website's Traffic";
		$description = "Simplify your traffic growth efforts and enhance your website traffic with Traffic-Bot.com's top-tier traffic bot software. Give it a try today!";
		$headingh1 = "The Leading Traffic Bot Generator";
		$subheadingh1 = "Traffic Bot Generator is designed to revolutionize your business's SEO, catapulting your rankings to the summit!";
		$featuresOneHeading = "Efficient Dashboards";
		$featuresOneText = "Our user-friendly dashboard makes managing your traffic projects simpler than ever.";
		$featuresTwoHeading = "Flexible Settings";
		$featuresTwoText = "Develop and refine your traffic bot projects, adjusting every traffic parameter to meet your requirements.";
		$featuresThreeHeading = "Dedicated Support";
		$featuresThreeText = "Our team is ready to assist with any inquiry or project. Contact our support through email or chat without hesitation.";
		$featuresFourHeading = "Boundless Bot Traffic Generation";
		$featuresFourText = "Create unlimited bot traffic with our software from over 195 locations worldwide!";
		$testimonial = "My site's performance metrics have reached new heights thanks to the extraordinary capabilities of Traffic Bot Generator!";
		$signupHeading = "Begin with the Top-Rated Bot Traffic Generator";


	} else if( startsWith($request_url, '/web-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "web-traffic-bot.html";
		$title = "#1 Web Traffic Bot Generator - Elevate Your Site's Visitor Count";
		$description = "Streamline your traffic growth strategy and enhance your website traffic with Traffic-Bot.com's highly-regarded traffic bot software. Test it out today!";
		$headingh1 = "The Premier Traffic Bot Solution";
		$subheadingh1 = "Web Traffic Bot is crafted to transform your business's SEO, propelling your rankings to unprecedented levels!";
		$featuresOneHeading = "Intelligent Dashboards";
		$featuresOneText = "Managing your traffic campaigns is now a breeze, thanks to our intuitive dashboard.";
		$featuresTwoHeading = "Configurable Settings";
		$featuresTwoText = "Design and tweak your traffic bot projects, customizing every traffic aspect to fulfill your goals.";
		$featuresThreeHeading = "Always-On Support";
		$featuresThreeText = "Our team is prepared to assist with any inquiries or projects. Feel free to reach our support via email or chat anytime.";
		$featuresFourHeading = "Infinite Traffic Bot Generation";
		$featuresFourText = "Harness our software to generate boundless bot traffic from more than 195+ locations across the globe!";
		$testimonial = "Traffic Bot is a true investment in the future of my online business. I've seen consistent growth in traffic since I started using it.";
		$signupHeading = "Start With The #1 Web Traffic Bot";

	} else if( startsWith($request_url, '/website-traffic-bot') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "website-traffic-bot.html";
		$title = "#1 Website Traffic Bot - Supercharge Your Site's Traffic";
		$description = "Streamline your traffic growth strategy and elevate your website's visitor count with Traffic-Bot.com's highly-acclaimed traffic bot software. Give it a try!";
		$headingh1 = "The Ultimate Website Traffic Bot";
		$subheadingh1 = "Website Traffic Bot is designed to transform your business's SEO, propelling your rankings to new heights!";
		$featuresOneHeading = "Intuitive Dashboards";
		$featuresOneText = "Effortlessly manage your traffic campaigns with our easy-to-navigate dashboard.";
		$featuresTwoHeading = "Customizable Settings";
		$featuresTwoText = "Build and modify your traffic bot projects, tailoring every traffic parameter to suit your objectives.";
		$featuresThreeHeading = "Round-the-Clock Support";
		$featuresThreeText = "Our team is here to assist you with any inquiries or projects. Reach out to our support via email or chat anytime.";
		$featuresFourHeading = "Limitless Traffic Bot Generation";
		$featuresFourText = "Leverage our software to produce infinite bot traffic from over 195 global locations!";
		$testimonial = "If you're struggling to gain traction online, look no further. Traffic Bot is the secret weapon for driving traffic and boosting your website's performance.";
		$signupHeading = "Start With The #1 Website Traffic Bot";




		
	} else if( startsWith($request_url, '/login') ) {
		$plans = $billing->getPlans(false);
		
		$content_filename = "login.html";
		$title = "Traffic Bot - Secure Login to Access Powerful Traffic Generation Tools";
		$description = "Log in to Traffic Bot & access powerful tools for generating website traffic. Increase online visibility & boost website traffic now."; 

	} else if( startsWith($request_url, '/coming-soon') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "coming-soon.html";
		$title = " Coming Soon - Traffic Bot - No1° Website Traffic Bot generator 2023 ";
		$description = "This site will be soon available, come back next month and see how we finished this page!"; 

	} else if( startsWith($request_url, '/coming-soon-simple') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "coming-soon-simple.html";
		$title = " Coming Soon - Traffic Bot - No1° Website Traffic Bot generator 2023 ";
		$description = "This site will be soon available, come back next month and see how we finished this page!";  

	} else if( startsWith($request_url, '/account-created') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "account-created.html";
		$title = "Welcome to Traffic Bot - Your Account for Website Traffic Generator Tools";
		$description = "Congratulations on creating your Traffic Bot account. Start boosting your website's traffic with our powerful website traffic generator tools.";  

	} else if( startsWith($request_url, '/landing-page-country') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "landing-page-country.html";

	} else if( startsWith($request_url, '/landing-page-device') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "landing-page-device.html";
		$title = "Google Analytics Traffic - Traffic Bot - No1! Website Traffic";

	} else if( startsWith($request_url, '/landing-page-mobile') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "landing-page-mobile.html";
		$title = "Traffic Bot - The Ultimate Website Traffic Generator for Improved SEO Rankings";
	$description = "Generate targeted website traffic with Traffic Bot - the powerful, user-friendly traffic generator that improves your SEO rankings and online visibility. Try it now!";

	} else if( startsWith($request_url, '/google-search-console-pricing') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "google-search-console-pricing.html";
		$title = "Traffic Bot - Google Search Console (SERP clicks) Pricing";
		$description = "Explore the pricing options for our Google Search Console integration on Traffic Bot. Drive more website traffic and boost online visibility with our powerful website traffic generator tools.";  
		
	} else if( startsWith($request_url, '/blog/pricing-naver') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "pricing-naver.html";
		$title = "Naver Traffic (SEO/SERP clicks) - Traffic Bot";
		$description = "Boost traffic to your Naver website with our customized packages. Our proven strategies and expert team will help you reach your audience. Get started now!";  



	} else if( startsWith($request_url, '/pricing-pro') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "pricing-pro.html";
		$title = "Traffic Bot - Affordable Bot Traffic Solutions for Your Website";
		$description = "Looking for affordable bot traffic for your website? Look no further than Traffic-Bot.com. Browse our pricing options and start boosting your website traffic today!";  

	} else if( startsWith($request_url, '/page-login-simple') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-login-simple.html";
		$title = "Traffic Bot - Secure Login to Access Powerful Website Traffic Generator Tools";
		$description = "Log in to Traffic Bot & access powerful website traffic generator tools. Increase online visibility & boost website traffic now with our traffic bot.";  

	} else if( startsWith($request_url, '/page-login') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-login.html";
		$title = "Access Website Traffic Generator Tools - Secure Login to Traffic Bot";
		$description = "Log in to your Traffic Bot account to start using our powerful website traffic generator tools. Boost online visibility and increase website traffic now.";  

	} else if( startsWith($request_url, '/page-reset-password') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-reset-password.html";
		$title = "Reset Password - Securely Reset your Traffic Bot account";
		$description = "Reset your Traffic Bot account password and regain access to our powerful website traffic generator tools. Keep your account secure and boost website traffic";  

	} else if( startsWith($request_url, '/reset-password') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "reset-password.html";
		$title = "Securely Reset Your Traffic Bot Account Password - Get Back to Business";
		$description = "Take control of your Traffic Bot account again with our secure password reset. Boost your website traffic safely and easily.";  


	} else if( startsWith($request_url, '/page-reset-password-simple') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-reset-password-simple.html";
		$title = "Traffic Bot - Password Reset for Secure Access to Website Traffic Generator Tools";
		$description = "Reset your Traffic Bot account password and regain secure access to our powerful website traffic generator tools. Keep your account secure and boost website traffic.";  

	} else if( startsWith($request_url, '/resend-activation') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "resend-activation.html";
		$title = "Activate Your Traffic Bot Account - Resend Activation Email";
		$description = "Resend your Traffic Bot account activation email and start using our powerful website traffic generator tools. Boost online visibility and increase website traffic now";  

	} else if( startsWith($request_url, '/listing-traffic-speed') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-traffic-speed.html";
		$title = "Traffic Bot Helpdesk - Optimize Website Traffic Speed";
		$description = "Get help optimizing your website's traffic speed with Traffic Bot Helpdesk. Improve website performance and boost online visibility now.";  

	} else if( startsWith($request_url, '/terms') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "terms.html";
		$title = "Traffic Bot - Terms of Service";
		$description = "Read the Traffic Bot Terms of Service to learn about the rules and guidelines for using our website traffic generation tools and services";  
	
	} else if( startsWith($request_url, '/faq') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "faq.html";
		$title = "Traffic Bot - Frequently Asked Questions";
		$description = "Get answers to frequently asked questions about using Traffic Bot's website traffic generation tools and services. Learn how to boost online visibility and drive more visitors to your site.";  

	} else if( startsWith($request_url, '/pricing') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "pricing.html";
		$title = "Traffic Bot - Pricing and Subscription Plans";
		$description = "Explore the pricing and subscription plans available on Traffic Bot. Learn how to boost your website's traffic and online visibility with our comprehensive pricing options.";  

	} else if( startsWith($request_url, '/features') ) {
		$plans = $billing->getPlans(false);
		
		$title = "Traffic Bot - Discover Our Powerful Features for Website Traffic Generation";
		$description = "Explore the powerful features of Traffic Bot and discover how to generate more website traffic and improve online visibility. Sign up now to start boosting your website's performance";  

		$content_filename = "features.html"; 

	} else if( startsWith($request_url, '/page-features') ) {
		$plans = $billing->getPlans(false);
		
		$title = "Traffic Bot - Discover Our Powerful Features for Website Traffic Generation";
		$description = "Explore the powerful features of Traffic Bot and discover how to generate more website traffic and improve online visibility. Sign up now to start boosting your website's performance";  

		$content_filename = "page-features.html";

	} else if( startsWith($request_url, '/coming-soon') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "coming-soon.html";
		$title = "Traffic Bot - Coming Soon";
		$description = "Stay tuned for updates and new features on Traffic Bot. Learn how to boost your website's traffic and online visibility with our upcoming tools and services.";  

	} else if( startsWith($request_url, '/helpdesk') ) {
		// print_r($_SERVER['REQUEST_URI']);
		$array = explode("/",$_SERVER['REQUEST_URI']);
		// echo $array[2];die;
		if(isset($array[2]) && $array[2]){
			$plans = $billing->getPlans(false);

		$new_url = $array[1].'/'.$array[2].'.html'; 
		$content_filename = $new_url;
		}else{
			$plans = $billing->getPlans(false);
			$content_filename = "helpdesk.html";
		$title = "Traffic Bot Helpdesk - Get Support for Website Traffic Optimization";
		$description = "Get the support you need to optimize your website's traffic with Traffic Bot Helpdesk. Improve website performance and boost online visibility now.";  
		}

		
	} else if( startsWith($request_url, '/listing-getting-started') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-getting-started.html";
		$title = "Traffic Bot Helpdesk - Get Started with Website Traffic Generation";
		$description = "Get started with website traffic generation and online visibility with Traffic Bot's comprehensive guide. Learn how to boost your website's performance and drive more visitors to your site.";  

	} else if( startsWith($request_url, '/listing-overview-traffic-type') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-overview-traffic-type.html";
		$title = "Traffic Bot Helpdesk - Overview of Different Types of Website Traffic";
		$description = "Learn about the different types of website traffic and how to generate them with Traffic Bot. Boost online visibility and drive more visitors to your site with our comprehensive overview.";  

	} else if( startsWith($request_url, '/listing-overview-traffic-settings') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-overview-traffic-settings.html";
		$title = "Traffic Bot Helpdesk - Overview of Traffic Settings and Optimization";
		$description = "Get a comprehensive overview of traffic settings and optimization with Traffic Bot. Learn how to boost online visibility and drive more visitors to your site by optimizing your website's traffic.";  

	} else if( startsWith($request_url, '/listing-overview-subscription') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-overview-subscription.html";
		$title = "Traffic Bot Helpdesk - Overview of Subscription Plans and Pricing";
		$description = "Explore the different subscription plans and pricing options available on Traffic Bot. Learn how to boost your website's traffic and online visibility with our comprehensive overview.";  
		
	} else if( startsWith($request_url, '/listing-overview-tracking') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-overview-tracking.html";
		$title = "Traffic Bot Helpdesk - Overview of Website Traffic Tracking and Analysis";
		$description = "Learn how to track and analyze your website's traffic with Traffic Bot. Get a comprehensive overview of the tools and techniques for boosting online visibility and driving more visitors to your site.";  

	} else if( startsWith($request_url, '/listing-account') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-account.html";
		$title = "Traffic Bot Helpdesk - Manage Your Account for Website Traffic Generation";
		$description = "Manage your account and access all the tools for website traffic generation on Traffic Bot. Boost online visibility and drive more visitors to your site with our comprehensive account management tools.";  
		
	} else if( startsWith($request_url, '/listing-project-settings') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-project-settings.html";
		$title = "Traffic Bot Helpdesk - Project Settings for Website Traffic Optimization";
		$description = "Explore the project settings available on Traffic Bot for optimizing your website's traffic. Boost online visibility and drive more visitors to your site by fine-tuning your project settings.";  
		
	} else if( startsWith($request_url, '/listing-payments') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-payments.html";
		$title = "Traffic Bot Helpdesk - Manage Payments for Website Traffic Generation Tools";
		$description = "Manage your payments and access all the tools for website traffic generation on Traffic Bot. Boost online visibility and drive more visitors to your site with our comprehensive payment management tools.";  
		
	} else if( startsWith($request_url, '/listing-tips') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "listing-tips.html";
		$title = "Traffic Bot Helpdesk - Expert Tips for Website Traffic Generation";
		$description = "Get expert tips and advice on website traffic generation with Traffic Bot. Boost online visibility and drive more visitors to your site with our comprehensive library of tips and tricks.";  

	} else if( startsWith($request_url, '/article-overview') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-overview.html";
		$title = "Traffic Bot Helpdesk - Overview of Website Traffic Generation";
		$description = "Get a comprehensive overview of website traffic generation with Traffic Bot. Learn how to boost online visibility and drive more visitors to your site with our detailed article.";  

	} else if( startsWith($request_url, '/article-getting-started') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-getting-started.html";
		$title = "Traffic Bot Helpdesk - Getting Started With Free Bot Traffic";
		$description = "Get a comprehensive overview of website traffic generation with Traffic Bot. Learn how to boost online visibility and drive more visitors to your site with our detailed article.";  

	} else if( startsWith($request_url, '/article-payments-bank-transfer') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-payments-bank-transfer.html";
		$title = "Traffic Bot Helpdesk - Payments with Bank Transfer";
		$description = "Learn how to make payments for Traffic Bot using bank transfer. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-payments-crypto') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-payments-crypto.html";
		$title = "Traffic Bot Helpdesk - Payments with Crypto";
		$description = "Learn how to make payments for Traffic Bot using cryptocurrencies. Learn how our bot traffic can help increase your website traffic..";  

		// New Pages Start
	
	} else if( startsWith($request_url, '/article-cancel-subscription') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-cancel-subscription.html";
		$title = "Helpdesk Article: How to Cancel Your Traffic-Bot.com Subscription";
		$description = "Learn how to cancel your subscription. See how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-device-settings') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-device-settings.html";
		$title = "Helpdesk Article: Optimizing Yprojects with Device Settings";
		$description = "Learn how to make payments for Traffic Bot using cryptocurrencies. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-direct-traffic') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-direct-traffic.html";
		$title = "Helpdesk Article: Direct Traffic and Its Impact on Your Website";
		$description = "Get a better understanding of direct traffic and its impact on your website. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-discounts-coupons') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-discounts-coupons.html";
		$title = "Helpdesk Article: How to Save Money with Discounts and Coupons";
		$description = "Get the best deals on Traffic-Bot.com bot traffic with our Helpdesk article on discounts and coupons. Learn how to save money with Traffic-Bot.com";  

	} else if( startsWith($request_url, '/article-geo-targeting') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-geo-targeting.html";
		$title = "Helpdesk Article: Get Traffic From Your Country with Geo-Targeting";
		$description = "Discover how to boost your online presence with geo-targeting in Traffic-Bot.com's support article. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-https-language') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-https-language.html";
		$title = "Helpdesk Article: How to Optimize Your Website Traffic by Choosing the Right Language";
		$description = "Looking to optimize your website traffic? Check out Traffic-Bot.com's Helpdesk article on choosing the right language for your visitors.";  

	} else if( startsWith($request_url, '/article-navigation-funnels') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-navigation-funnels.html";
		$title = "Helpdesk Article: How to Improve Your Project and set Navigation Funnels";
		$description = "Improve your project and set navigation funnels with Traffic-Bot.com's Helpdesk article. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-payment-options') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-payment-options.html";
		$title = "Helpdesk Article: Secure and Convenient Payment Options for Traffic-Bot.com";
		$description = "Learn about secure and convenient payment options for Traffic-Bot.com's reliable bot traffic solutions in our Helpdesk article.";  

	} else if( startsWith($request_url, '/article-plans') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-plans.html";
		$title = "Understanding Traffic-Bot.com's Website Traffic Plans - A Support Article";
		$description = "Get a better understanding of Traffic-Bot.com's website traffic plans with our support article. Learn how our bot traffic can help increase your website traffic.";  

	} else if( startsWith($request_url, '/article-purchase-credits') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-purchase-credits.html";
		$title = "Helpdesk Article: Purchase Credits and Get Started with Traffic-Bot.com";
		$description = "Looking to boost your website traffic? Check out Traffic-Bot.com's Helpdesk article on credit purchases and our reliable bot traffic solutions.";  

	} else if( startsWith($request_url, '/article-timezones') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-timezones.html";
		$title = "Helpdesk Article: How to Optimize Website Traffic with Timezones feature with Traffic-Bot.com";
		$description = "Learn how Traffic-Bot.com's bot traffic can increase website traffic and improve online presence. Check out our Helpdesk article on the timezones feature today.";  

	} else if( startsWith($request_url, '/article-delete-project') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-delete-project.html";
		$title = "Traffic Bot Helpdesk - Deleting a Project";
		$description = "Learn how to delete a project on Traffic Bot. Get a comprehensive overview of the process and what you need to know to manage your website's traffic and online visibility.";  

	} else if( startsWith($request_url, '/article-google-analytics') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-google-analytics.html";
		$title = "Traffic Bot Helpdesk - Google Analytics";
		$description = "Learn how to delete a project on Traffic Bot. Get a comprehensive overview of the process and what you need to know to manage your website's traffic and online visibility.";  

		// New Pages End

	} else if( startsWith($request_url, '/article-etsy') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-etsy.html";
		$title = "Traffic Bot Helpdesk - Boosting Traffic on Etsy";
		$description = "Learn how to boost your website's traffic and online visibility on Etsy using Traffic Bot. Get a comprehensive overview of the process and tips for success.";  

	} else if( startsWith($request_url, '/article-youtube') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-youtube.html";
		$title = "Traffic Bot Helpdesk - Boosting Traffic on YouTube";
		$description = "Learn how to boost your website's traffic and online visibility on YouTube using Traffic Bot. Get a comprehensive overview of the process and tips for success.";  

	} else if( startsWith($request_url, '/article-upgrading') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-upgrading.html";
		$title = "Traffic Bot Helpdesk - Upgrading Your Subscription";
		$description = "Learn how to upgrade your subscription on Traffic Bot. Get a comprehensive overview of the process and what you need to know to boost your website's traffic and online visibility.";  

	} else if( startsWith($request_url, '/article-stop-project') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-stop-project.html";
		$title = "Traffic Bot Helpdesk - How to Stop a Running Project";
		$description = "Easily manage your website's traffic and online visibility by stopping running projects on Traffic Bot. Learn how to do it with our comprehensive guide and expert tips.";  

	} else if( startsWith($request_url, '/article-multiple-traffic-sources') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-multiple-traffic-sources.html";
		$title = "Helpdesk Article: Website Traffic from Multiple Sources";
		$description = "Maximize website performance and online visibility by using multiple traffic sources with Traffic Bot. Learn the best techniques and strategies for website optimization.";  

	} else if( startsWith($request_url, '/article-social-traffic') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-social-traffic.html";
		$title = "Traffic Bot Helpdesk - Generating Social Media Traffic for Your Website";
		$description = "Learn how to generate social media traffic for your website with Traffic Bot. Get a comprehensive overview of the process, tips and strategies to boost your website's online visibility and drive more visitors.";  

	} else if( startsWith($request_url, '/article-traffic-speed') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-traffic-speed.html";
		$title = "Traffic Bot Helpdesk - Optimizing Website Traffic Speed";
		$description = "Learn how to optimize website traffic speed and improve online visibility with Traffic Bot. Get a comprehensive overview of the tools, techniques and strategies to boost your website's performance and drive more visitors.";  

	} else if( startsWith($request_url, '/article-overview') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-overview.html";
		$title = "Traffic Bot Helpdesk - Overview of Website Traffic Generation";
		$description = "Get a comprehensive overview of website traffic generation with Traffic Bot. Learn how to boost online visibility and drive more visitors to your site with our detailed article.";  

	} else if( startsWith($request_url, '/article-respect-time-of-the-day') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-respect-time-of-the-day.html";
		$title = "Traffic Bot Helpdesk - Generating Website Traffic at the Optimal Time of Day";
		$description = "Maximize website traffic by generating it at the optimal time of day with Traffic Bot. Learn the best practices, tips, and strategies to improve online visibility and drive more visitors.";  

	} else if( startsWith($request_url, '/article-bounce-rate') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-bounce-rate.html";
		$title = "Traffic Bot Helpdesk - Understanding and Improving Bounce Rate";
		$description = "Get help understanding and improving your website's bounce rate with Traffic Bot Helpdesk. Learn the techniques and strategies to keep visitors engaged and drive more traffic to your site.";  

	} else if( startsWith($request_url, '/article-time-on-each-page') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-time-on-each-page.html";
		$title = "Traffic Bot - Understanding Time Spent on Each Page of Website";
		$description = "Learn how to understand the time spent on each page of your website with Traffic Bot. Get a comprehensive overview of the techniques and strategies to improve visitor engagement and drive more traffic to your site.";  

	} else if( startsWith($request_url, '/article-returning-visitors') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-returning-visitors.html";
		$title = "Traffic Bot - Understanding and Attracting Returning Visitors";
		$description = "Learn how to understand and attract returning visitors to your website with Traffic Bot. Get a comprehensive overview of the techniques and strategies to improve visitor engagement and drive more repeat traffic to your site.";  

	} else if( startsWith($request_url, '/article-shortner') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-shortner.html";
		$title = "Traffic Bot - Understanding and Using URL Shorteners";
		$description = "Learn how to understand and use URL shorteners with Traffic Bot. Get a comprehensive overview of the techniques and strategies to improve sharing and tracking of your website's links and drive more traffic to your site.";  

	} else if( startsWith($request_url, '/article-google-adsense') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-google-adsense.html";
		$title = "Traffic Bot - Understanding and Using Google AdSense";
		$description = "Learn how to understand and use Google AdSense with Traffic Bot. Get a comprehensive overview of the techniques and strategies to monetize your website's traffic and boost revenue.";  

	} else if( startsWith($request_url, '/article-traffic-types') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-traffic-types.html";
		$title = "Traffic Bot - Understanding Different Types of Website Traffic";
		$description = "Learn how to understand the different types of website traffic with Traffic Bot. Get a comprehensive overview of the techniques and strategies to drive more visitors to your site and boost online visibility.";  

	} else if( startsWith($request_url, '/article-organic-traffic') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-organic-traffic.html";
		$title = "Traffic Bot - Boosting Website Visibility with Organic Traffic";
		$description = "Increase your website's online visibility by understanding and generating organic traffic with Traffic Bot. Learn the techniques and strategies to drive more visitors to your site.";  
	
	} else if( startsWith($request_url, '/article-referral-traffic') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-referral-traffic.html";
		$title = "Traffic Bot - Driving Visitors to Your Site with Referral Traffic";
		$description = "Drive more visitors to your website by understanding and generating referral traffic with Traffic Bot. Learn the techniques and strategies to boost your website's online visibility.";  
	
	} else if( startsWith($request_url, '/article-http-language-codes') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-http-language-codes.html";
		$title = "Traffic Bot - Understanding and Using HTTP Language Codes";
		$description = "Learn how to understand and use HTTP language codes with Traffic Bot. Get a comprehensive overview of the techniques and strategies to improve the localization and internationalization of your website and drive more visitors.";  

	} else if( startsWith($request_url, '/article-rss-feed') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "article-rss-feed.html";
		$title = "Traffic Bot - Understanding and Using RSS Feeds";
		$description = "Learn how to understand and use RSS feeds with Traffic Bot. Get a comprehensive overview of the techniques and strategies to improve the distribution and visibility of your website's content and drive more visitors.";  

	} else if( startsWith($request_url, '/landing-classic-software') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "landing-classic-software.html";
		$title = "";
		$description = "";  

	} else if( startsWith($request_url, '/ctr-manipulation') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "ctr-manipulation.html";
		$title = "Buy CTR Manipulation: Improve Your Click Through Rate ";
		$description = "Discover the tactics behind CTR Manipulation and learn how to boost your click-through rates. Optimize your online presence and improve user engagement with proven strategies.";  

	} else if( startsWith($request_url, '/page-terms') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-terms.html";
		$title = "Traffic Bot - Terms and Conditions";
		$description = "Learn about the terms and conditions of using Traffic Bot's website traffic generation tools and services. Get a comprehensive overview of our legal agreement and understand how to use our platform.";  

	} else if( startsWith($request_url, '/privacy') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-privacy-policy.html";
		$title = "Traffic Bot - Privacy Policy";
		$description = "Learn about Traffic Bot's commitment to protecting your privacy. Get a comprehensive overview of our privacy policy, including information on how we collect, use, and protect your personal data.";  

	} else if( startsWith($request_url, '/page-status') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "page-status.html";
		$title = "Status and Updates - Stay Informed on the Latest Features";
		$description = "Stay informed with our Traffic Bot status and updates page. Get the latest information on system status, recent updates, and new features. Trustworthy and reliable online presence.";  

	} else if( startsWith($request_url, '/sitemap') ) {
		$plans = $billing->getPlans(false);

		$content_filename = "sitemap.xml";



		





// How to add new page to website, copy code below and add above in order to add new page to site and remove //

	// } else if( startsWith($request_url, '/help') ) {
	//	$plans = $billing->getPlans(false);

	//	$content_filename = "help.html";








	} else if( startsWith($request_url, '/reset-password') ) {
		$plans = $billing->getPlans(false);

		if( isset($_POST['username']) ) {
			if( $account->resetPassword($_POST['username']) ) 
				$success = true;
			else
				$error = 'There was an error resetting your password, we couldn\'t find your email in our database';
		}
		
		$content_filename = "reset-password.html";
	} else if( startsWith($request_url, '/check_url_for_trial') ) {
		$trial_url = isset($_REQUEST['url']) ? trim($_REQUEST['url']) : '';
		$url_eligible_for_trial = false;

		if( $trial_url != '' && !$project->isDomainInTheDatabase($trial_url) && $api->checkURLForDemo($trial_url) ) {
			$url_eligible_for_trial = true;
		}

		echo $url_eligible_for_trial ? "OK" : "NO";			
		exit(0);
	} else if( startsWith($request_url, '/activate') ) {
		$plans = $billing->getPlans(false);

		if( isset($_GET['code']) ) {
			if( $account->activateAccount($_GET['code']) ) 
				$success = true;
			else
				$error = 'There was an error activating your account, check the link please';
		} else {
			$error = 'No code specified, check the link please';
		}

		$content_filename = "activate.html";
	} else if( startsWith($request_url, '/ipn') ) {
		$billing->processIPN();
	} else {
		$regions = $project->getRegions();
		$plans = $billing->getPlans(false);
		$content_filename = "index.html";
		
		$title = "Traffic Bot - The Ultimate Website Traffic Generator 2023";
		$description = "Drive bot traffic to your website with Traffic Bot - the ultimate website traffic generator. Our powerful tools and services help you to improve your website's traffic."; 
	}


	include('blog/'.$content_filename); 



