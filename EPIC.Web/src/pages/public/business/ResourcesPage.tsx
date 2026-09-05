import "../../../components/business/business.css";


interface ResourcesPageProps {

    onNavigate?:
    (
        page:string
    )=>void;

}



export default function ResourcesPage(
{
    onNavigate

}:ResourcesPageProps)
{


const blogs = [

{
    title:
    "Building Stronger Church Communities",

    category:
    "Leadership",

    description:
    "Practical strategies to engage members and build a healthier ministry culture.",

    date:
    "September 1, 2026"
},


{
    title:
    "Digital Ministry: Using Technology for Growth",

    category:
    "Technology",

    description:
    "How churches can use digital tools to improve communication and ministry operations.",

    date:
    "August 20, 2026"
},


{
    title:
    "Developing Effective Ministry Leaders",

    category:
    "Leadership",

    description:
    "Learn how to develop leaders who can serve and grow your ministry.",

    date:
    "August 10, 2026"
},


{
    title:
    "Church Administration Best Practices",

    category:
    "Administration",

    description:
    "Simple systems that help churches organize their daily operations.",

    date:
    "August 1, 2026"
}


];





return (

<div className="business-page">





{/* =====================
    BLOG HERO
===================== */}


<section className="business-hero">


<div className="business-container">


<span className="blog-label">

EPIC BLOG

</span>



<h1>

Insights For Church Leaders

</h1>




<p>

Articles, leadership insights,
ministry strategies, and resources
to help churches grow.

</p>


</div>


</section>








{/* =====================
    BLOG POSTS
===================== */}



<section className="business-section">


<div className="business-container">


<h2>

Latest Articles

</h2>





<div className="blog-grid">



{

blogs.map(blog=>(


<div

className="blog-card"

key={
blog.title
}

>


<span className="blog-category">

{
blog.category
}

</span>





<h3>

{
blog.title
}

</h3>





<p>

{
blog.description
}

</p>






<div className="blog-footer">


<small>

{
blog.date
}

</small>





<button

onClick={()=>

onNavigate?.(
"blog-detail"
)

}

>

Read Article →

</button>



</div>




</div>


))


}



</div>


</div>


</section>







{/* =====================
    CATEGORIES
===================== */}



<section className="business-section light">


<div className="business-container">


<h2>

Explore Topics

</h2>



<div className="blog-categories">


<span>
Leadership
</span>


<span>
Ministry
</span>


<span>
Technology
</span>


<span>
Faith
</span>


<span>
Church Growth
</span>


</div>



</div>


</section>





</div>

);


}