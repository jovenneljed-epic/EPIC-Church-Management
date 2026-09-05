import "../../../components/business/business.css";


interface BlogDetailPageProps {

    onBack?:()=>void;

}



export default function BlogDetailPage(
{
    onBack

}:BlogDetailPageProps)
{


return (

<div className="business-page">


<section className="business-hero">


<div className="business-container">


<span className="blog-label">

LEADERSHIP

</span>



<h1>

Building Stronger Church Communities

</h1>




<p>

Practical strategies for creating
a healthy and growing ministry.

</p>



</div>


</section>







<section className="business-section">


<div className="business-container">



<article className="blog-article">



<small>

September 1, 2026

</small>




<h2>

Introduction

</h2>



<p>

A strong church community is built through
relationships, discipleship, and intentional
leadership.

</p>





<h2>

1. Build Strong Relationships

</h2>



<p>

People stay connected when they feel
valued and involved. Churches grow when
members move beyond attendance into
participation.

</p>





<h2>

2. Develop Ministry Leaders

</h2>



<p>

Healthy ministries require leaders who are
equipped, encouraged, and empowered
to serve others.

</p>






<h2>

3. Use Technology Wisely

</h2>



<p>

Digital tools can help churches communicate,
organize teams, and stay connected.

</p>





<h2>

Conclusion

</h2>



<p>

Church growth begins with people.
When churches invest in relationships
and leadership, communities become
stronger.

</p>




<button

onClick={
onBack
}

>

← Back To Articles

</button>



</article>


</div>


</section>


</div>


);


}