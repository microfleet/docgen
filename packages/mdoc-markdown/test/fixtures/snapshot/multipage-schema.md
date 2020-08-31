<a name="top"></a>
# Service @microfleet/apidoc-plugin-json-schema v0.0.0



- [withReference](#withReference)
	- [](#)
	


# <a name='withReference'></a> withReference
## <a name=''></a> 
<p>api schema with reference</p>

Source: [/sample/src/with-reference.js](/sample/src/with-reference.js).
```
GET /api/some-with-reference
```



### Response schema:

<a name="with-reference--"/>`{object}`<br>
Additional properties allowed: `true`<br>
Properties:

 - **myfield**
    [(common#/definitions/field)](zSchemaDefinitions.md#common--/definitions/field)
 - **secondField**
    [(request#)](withReference.md#request--)
 - **otherField**
    [(#/definitions/other-field)](withReference.md#with-reference--/definitions/other-field)

**Definitions**:

 - **with-reference#/definitions/other-field**
    <a name="with-reference--/definitions/other-field"/>`{number}`<br>
    <br>





**[⬆ Back to Top](#top)**
