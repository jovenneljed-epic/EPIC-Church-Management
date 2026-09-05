import {
    useEffect,
    useState
} from "react";


import {
    getAnnouncements
} from "../../../services/announcementService";


import type {
    Announcement
} from "../../../services/announcementService";


import {
    getUpcomingChurchServices
} from "../../../services/churchService";


import type {
    ChurchService
} from "../../../services/churchService";


import {
    getMinistryEvaluations
} from "../../../services/ministryService";


import type {
    MinistryEvaluation
} from "../../../services/ministryService";


import "../../../components/business/whatsnew.css";



interface WhatsNewPageProps {

    onNavigate?:
    (
        url:string
    )=>void;

}




export default function WhatsNewPage(
{
    onNavigate

}:WhatsNewPageProps)
{


const [
    announcements,
    setAnnouncements
]
=
useState<Announcement[]>([]);



const [
    services,
    setServices
]
=
useState<ChurchService[]>([]);



const [
    ministries,
    setMinistries
]
=
useState<MinistryEvaluation[]>([]);



const [
    expandedEventId,
    setExpandedEventId
]
=
useState<number|null>(null);





useEffect(()=>{


async function loadData()
{

try
{


const [

announcementData,

serviceData,

ministryData

]
=
await Promise.all([


getAnnouncements(),


getUpcomingChurchServices(),


getMinistryEvaluations()


]);



setAnnouncements(
    announcementData
);



setServices(
    serviceData
);



setMinistries(
    ministryData
);



}
catch(error)
{

console.error(
    "Failed loading What's New",
    error
);

}


}



loadData();


},[]);







const featuredAnnouncement =

announcements.find(
item=>item.imageUrl
)

||

announcements[0];





const latestAnnouncements =

announcements.filter(

item=>

item.id !== featuredAnnouncement?.id

);







function getServiceIcon(
type:string
)
{

switch(type)
{

case "SUNDAY WORSHIP":

return "🙏";


case "PRAYER MEETING":

return "🔥";


case "YOUTH FELLOWSHIP":

return "⚡";


default:

return "⛪";

}

}







return (

<div className="epic-whats-new">



{/* HERO */}

<section className="wn-hero">

<div className="business-container">


<span className="wn-label">

EPIC COMMUNITY

</span>



<h1>

What's New at EPIC

</h1>


<p>

Stay connected with ministry events,
church activities, announcements,
and EPIC platform updates.

</p>


</div>

</section>







{/* FEATURED ANNOUNCEMENT */}


{

featuredAnnouncement &&


<section className="wn-section">


<div className="business-container">


<div className="featured-update">


<div className="featured-image">


{

featuredAnnouncement.imageUrl &&


<img

src={
featuredAnnouncement.imageUrl
}

alt={
featuredAnnouncement.title
}

/>


}


</div>




<div className="featured-text">


<span>

{
featuredAnnouncement.category
}

</span>



<h2>

{
featuredAnnouncement.title
}

</h2>



<p>

{
featuredAnnouncement.content
}

</p>


</div>


</div>


</div>


</section>


}








{/* UPCOMING EVENTS */}


<section className="wn-section">


<div className="business-container">


<h2>

Upcoming Events

</h2>



<div className="events-grid">


{

services.slice(0,8).map(service=>(


<div

className="event-card"

key={
service.churchServiceId
}

>


<div className="event-date">


<strong>

{
new Date(
service.serviceDate
).getDate()

}

</strong>



<span>

{
new Date(
service.serviceDate
)

.toLocaleString(
"en",
{
month:"short"
}
)

}

</span>


</div>





<h3>

{
getServiceIcon(
service.serviceType
)

}

{" "}

{
service.serviceName
}

</h3>




<p>

🕒 {service.startTime}

</p>



<p>

📍 {service.location}

</p>



<button


onClick={()=>


setExpandedEventId(

expandedEventId === service.churchServiceId

?

null

:

service.churchServiceId

)

}


>


{

expandedEventId === service.churchServiceId

?

"Hide Program ↑"

:

"Program ↓"

}


</button>

{

expandedEventId === service.churchServiceId &&


<div className="program-box">


{

(service.description ?? "")

.split("\n")

.filter(
line => line.trim()
)

.map(

(line,index)=>(


<p

key={index}

>

{index + 1}. {line}

</p>


)

)

}



</div>

}

</div>


))


}


</div>


</div>


</section>









{/* =========================
    MINISTRY DEPARTMENTS
========================= */}


<section className="wn-section">


<div className="business-container">


<h2>

Ministry Departments

</h2>



<div className="ministry-grid">


{

ministries.map(ministry=>(


<div

className="ministry-card"

key={
ministry.ministryId
}

>


<div className="ministry-icon">

⛪

</div>



<h3>

{
ministry.ministryName
}

</h3>





<div className="ministry-info">


<span>

👥 Members

</span>


<strong>

{
ministry.totalMembers
}

</strong>



</div>





<div className="ministry-info">


<span>

Ministry Head

</span>



<strong>

{
ministry.ministryHead ||
"Not Assigned"

}

</strong>



</div>







<button

className="evaluation-button"

onClick={()=>


onNavigate?.(

`/ministry-evaluation/${ministry.ministryId}`

)

}

>

View Ministry →

</button>



</div>


))


}


</div>


</div>


</section>









{/* LATEST UPDATES */}


<section className="wn-section">


<div className="business-container">


<h2>

Latest EPIC Updates

</h2>



<div className="news-list">


{

latestAnnouncements.map(item=>(


<div

className="news-item"

key={
item.id
}

>


<h3>

{
item.title
}

</h3>


<p>

{
item.content
}

</p>



</div>


))


}


</div>


</div>


</section>








{/* CTA */}


<section className="wn-cta">


<div className="business-container">


<h2>

Continue exploring EPIC

</h2>


<button

onClick={()=>onNavigate?.("academy")}

>

Visit EPIC Academy →

</button>


</div>


</section>






</div>


);


}