import {
    useEffect,
    useState
} from "react";




import {
    getAdminBlogs,
    createBlogPost
} from "../../services/blogService";


import type {
    BlogPost
} from "../../services/blogService";


import "./blogManagement.css";



export default function BlogManagement()
{


const [
    blogs,
    setBlogs
]
=
useState<BlogPost[]>([]);



const [
    title,
    setTitle
]
=
useState("");



const [
    category,
    setCategory
]
=
useState("");



const [
    content,
    setContent
]
=
useState("");



const [
    loading,
    setLoading
]
=
useState(false);


const [
    message,
    setMessage
] = useState("");


async function loadBlogs()
{

try
{

const data =
await getAdminBlogs();


setBlogs(
    data
);


}

catch(error)
{

console.error(
    "Loading blogs failed",
    error
);

}

}






useEffect(()=>{

loadBlogs();

},[]);






async function saveArticle(
    publish:boolean
)
{

try
{

setLoading(true);

setMessage("");



await createBlogPost({

    title,

    category,

    content,

    isPublished:
        publish

});



setMessage(
    publish
    ?
    "Article published successfully!"
    :
    "Draft saved successfully!"
);



setTitle("");

setCategory("");

setContent("");



await loadBlogs();


}
catch(error)
{

console.error(
    "BLOG CREATE ERROR",
    error
);


setMessage(
    "Failed saving article."
);


}
finally
{

setLoading(false);

}

}


return (

<div className="blog-management">



<section className="blog-header">


<h1>
    Blog Management
</h1>

{
message && (
    <div className="blog-message">
        {message}
    </div>
)
}

<p>
Create and manage EPIC blog articles
</p>


</section>







<section className="blog-editor">


<h2>
Create Article
</h2>




<label>
Article Title
</label>


<input

value={title}

onChange={
e=>setTitle(
e.target.value
)
}

placeholder="Enter article title"

/>





<label>
Category
</label>


<input

value={category}

onChange={
e=>setCategory(
e.target.value
)
}

placeholder="Example: Leadership"

/>





<label>
Article Content
</label>


<textarea

value={content}

onChange={
e=>setContent(
e.target.value
)
}

placeholder="Write your article..."

rows={10}

/>






<div className="blog-buttons">


<button

disabled={loading}

onClick={()=>saveArticle(false)}

>

Save Draft

</button>





<button

disabled={loading}

onClick={()=>saveArticle(true)}

>

Publish Article

</button>



</div>


</section>









<section className="blog-list">


<h2>
Articles
</h2>



{

blogs.map(blog=>(


<div

className="blog-card"

key={
blog.blogPostId
}

>


<div>


<h3>

{
blog.title
}

</h3>



<span>

{
blog.category
}

</span>


</div>




<div

className={
blog.isPublished
?
"status published"
:
"status draft"
}

>

{

blog.isPublished
?
"Published"
:
"Draft"

}

</div>




</div>


))

}



</section>





</div>

);


}