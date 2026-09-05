import {
    useEffect,
    useState
} from "react";


import {
    getMinistryEvaluationDetail
} from "../../../services/ministryService";


import type {
    MinistryEvaluationDetail
} from "../../../services/ministryService";


import "../../../components/business/whatsnew.css";



interface Props {

    ministryId:number;

}



export default function MinistryEvaluationPage(
{
    ministryId

}:Props
){


const [
    ministry,
    setMinistry
]=useState<MinistryEvaluationDetail | null>(null);



const [
    loading,
    setLoading
]=useState(true);





useEffect(()=>{


async function loadData()
{

try
{

const data =
await getMinistryEvaluationDetail(
    ministryId
);


setMinistry(data);


}
catch(error)
{

console.error(
    "Failed loading ministry evaluation",
    error
);

}
finally
{

setLoading(false);

}

}


loadData();


},[
    ministryId
]);





if(loading)
{

return (

<div className="epic-whats-new">

<section className="wn-section">

<div className="business-container">

<h2>
Loading Ministry Evaluation...
</h2>

</div>

</section>

</div>

);

}





if(!ministry)
{

return (

<div className="epic-whats-new">

<section className="wn-section">

<div className="business-container">

<h2>
Ministry Not Found
</h2>

</div>

</section>

</div>

);

}





return (

<div className="epic-whats-new">


<section className="wn-hero">

<div className="business-container">


<span className="wn-label">

MINISTRY EVALUATION

</span>



<h1>

{ministry.ministryName}

</h1>



<p>

{ministry.description}

</p>


</div>

</section>





<section className="wn-section">


<div className="business-container">


<div className="ministry-card">


<h3>
👤 Ministry Head
</h3>


<p>
{ministry.ministryHead}
</p>





{/* =========================
    MEETING INFORMATION
========================= */}


<div className="evaluation-info-grid">


<div className="evaluation-info-card">

<span>
📅 Meeting Day
</span>


<strong>
{
    ministry.meetingDay ||
    "Not Assigned"
}
</strong>


</div>





<div className="evaluation-info-card">

<span>
🕒 Meeting Time
</span>


<strong>
{
    ministry.meetingTime ||
    "Not Assigned"
}
</strong>


</div>





<div className="evaluation-info-card">

<span>
📍 Location
</span>


<strong>
{
    ministry.meetingLocation ||
    "Not Assigned"
}
</strong>


</div>



</div>





<h3>
👥 Members ({ministry.totalMembers})
</h3>
<div className="member-dropdown">


{
(ministry.members ?? []).map(member=>(

<div

className="member-item"

key={
member.memberId
}

>

<strong>
{member.name}
</strong>


<span>
{member.role}
</span>


<small>
{member.position}
</small>


</div>

))

}


</div>


</div>


</div>


</section>


</div>

);


}