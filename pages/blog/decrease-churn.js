import Head from 'next/head'

export default function DecreaseChurnPost() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Decrease Attendee Churn for Tech Events</title>
        <meta 
          name="description" 
          content="Learn how to increase the number of people who show up to your hackathon after they signup"
        />
      </Head>

      <main style={{display: "flex", width: "100%", alignItems: "center", justifyContent: "center"}}>
        <div style={{maxWidth: "700px"}}>
            <h1>How to decrease tech event churn?</h1>
            <p>Hackathons... product launches... meetups... they all suffer high churn rates (often &gt;50%).</p>
            <p>How to decrease churn? 
            Increase touch points with attendees before the event. For most events, this looks like sending emails &amp; potentially texts through Lu.ma to attendees.</p>
            <p>Each touch point should require minimal effort but should be a vote in terms of the user committing to the event. Here are some examples of touch points you can have with attendees before your event to get them invested:</p>
            <ol>
            <li>&quot;Reserve your T-Shirt (size needed)&quot;  - if attendees know you&#39;re setting aside a t-shirt specifically for them, they&#39;re more likely to show up because they see you&#39;re investing in them and they wouldn&#39;t want it to go to waste.</li>
            <li>&quot;Preorder your Lunch (Burritos)&quot; - this is a variant of the &quot;reserve your t-shirt&quot; email. It works for the same reasons, but also helps make sure you don&#39;t order more food than you need and that you order the right amount of each item.</li>
            <li>&quot;Join The Event Discord &amp; find a team&quot; - once the attendee of your event has started interacting with other attendees, they start to feel even more committed to the event</li>
            <li>&quot;Here&#39;s a buddy pass, invite a friend?&quot; - giving attendees the opportunity to invite their friends &amp; increases the likelihood that they&#39;ll show up &amp; it also means their friend might too.</li>
            <li>&quot;Confirm attendance &amp; event location&quot; - the night before the event, if you require attendees to confirm they&#39;re attending the event and remind them of the location of the event, they&#39;ll be more likely to make a point of orienting their schedule around it</li>
            </ol>
            <p>The more touch points you have with attendees, the more will actually show up to your event. The more you show that you&#39;re invested in them, the more they&#39;ll think about you and give you their valuable time by showing up to your event. </p>
            <p>You can send these "blasts" through Lu.ma or an external email client. Personally I've always used <a href="https://loops.so/">loops</a> & I love it.</p>
            <p>~Thomas <br/>
            <em>In life we are always learning</em></p>
        </div>
      </main>
    </div>
  )
}
