import GenericPostForm from '../components/Genericpostform';

export function OutgoingExternalPage() {
  return (
    <GenericPostForm
      title="إدخال مستند جديد (صادر خارجي)"
      endpoint="/PostExternal/CreatePostExternal"
      serialPrefix="SDE-"
      serialNumberEndpoint="/PostExternal/GetPostExternalMaxSerialNumber"
      fetchCompanies
      fetchDeliveryDirection
      enableCompanyDelivery
      enableFollowingPerson = {true}
      defaultDeliveryType = "Company"
    />
  );
}

export function OutgoingInternalPage() {
  return (
    <GenericPostForm
      title="إدخال مستند جديد (صادر داخلي)"
      endpoint="/PostInternal/CreatePostInternal"
      serialPrefix="SDI-"
      serialNumberEndpoint="/PostInternal/GetPostInternalMaxSerialNumber"
      fetchCompanies={true}
      fetchDeliveryDirection
      hideDepartment={false}
      enableCompanyDelivery
      enableFollowingPerson = {true}
    />
  );
}

export function OutgoingTransformPage() {
  return (
    <GenericPostForm
      title="إدخال مستند جديد (صادر محول)"
      endpoint="/PostTransformer/CreatePostTransformer"
      serialPrefix="SDT-"
      serialNumberEndpoint="/PostTransformer/GetPostTransformerMaxSerialNumber"
      fetchCompanies={true}
      postnumberEnable = {true}  
      fetchDeliveryDirection
      hideDepartment={false}
      enableCompanyDelivery
      enableFollowingPerson = {true}
    />
  );
}